const { GoogleGenerativeAI } = require("@google/generative-ai");
const translate = require('google-translate-api-x');

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

const TRANSLATION_LANGUAGE_LABELS = {
    en: 'English',
    mn: 'Mongolian',
    ru: 'Russian'
};

const cleanList = (values = []) => {
    if (!Array.isArray(values)) {
        return [];
    }

    return [...new Set(
        values
            .map((value) => String(value || '').trim().toLowerCase())
            .filter(Boolean)
    )].slice(0, 8);
};

const clamp = (value, min = 0, max = 1) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
        return min;
    }
    return Math.min(max, Math.max(min, numeric));
};

const fallbackProfileFromBio = (text = '') => {
    const bio = text.toLowerCase();

    const keywordBuckets = {
        goals: [
            'startup', 'research', 'internship', 'hackathon', 'open source',
            'career growth', 'portfolio', 'leadership', 'ai project'
        ],
        skills: [
            'javascript', 'react', 'node', 'python', 'java', 'docker',
            'kubernetes', 'devops', 'design', 'figma', 'writing'
        ],
        interests: [
            'ai', 'machine learning', 'robotics', 'music', 'gaming',
            'design', 'sports', 'community', 'entrepreneurship'
        ]
    };

    const collectMatches = (entries) =>
        cleanList(entries.filter((entry) => bio.includes(entry)));

    const goals = collectMatches(keywordBuckets.goals);
    const skills = collectMatches(keywordBuckets.skills);
    const interests = collectMatches(keywordBuckets.interests);

    return {
        summary: text.trim().slice(0, 240) || 'Ambitious student looking for meaningful collaborators.',
        goals: goals.length ? goals : ['collaboration', 'project building'],
        skills: skills.length ? skills : ['communication', 'teamwork'],
        interests: interests.length ? interests : ['technology', 'learning'],
        traits: {
            tech: bio.includes('devops') || bio.includes('code') || bio.includes('python') ? 0.86 : 0.52,
            creative: bio.includes('design') || bio.includes('art') || bio.includes('writing') ? 0.78 : 0.48,
            social: bio.includes('team') || bio.includes('community') || bio.includes('lead') ? 0.82 : 0.56
        }
    };
};

const parseModelJson = (rawText) => {
    const fencedMatch = rawText.match(/```json\s*([\s\S]*?)```/i);
    const candidate = fencedMatch ? fencedMatch[1] : rawText;
    const trimmed = candidate.trim();
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('Model did not return a JSON object');
    }

    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
};

const extractProfile = async (text = '') => {
    try {
        if (!genAI) {
            throw new Error('Gemini is not configured');
        }
        
        // Try models in order of availability
        let model;
        try {
            model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        } catch (e) {
            try {
                model = genAI.getGenerativeModel({ model: "gemini-pro" });
            } catch (e2) {
                model = genAI.getGenerativeModel({ model: "text-bison" });
            }
        }
        
        const prompt = `
You are extracting a student collaboration profile for an app called Cipher.
Return only valid JSON with this exact shape:
{
  "summary": "string under 240 chars",
  "goals": ["lowercase short labels"],
  "skills": ["lowercase short labels"],
  "interests": ["lowercase short labels"],
  "traits": {
    "tech": 0-1,
    "creative": 0-1,
    "social": 0-1
  }
}

Rules:
- goals, skills, interests must each contain 2 to 8 items when possible
- keep labels concise and lowercase
- traits must be decimals between 0 and 1
- no markdown, no commentary, only JSON

Student bio:
${text}
        `;

        const result = await model.generateContent(prompt);
        const rawText = result.response.text();
        const parsed = parseModelJson(rawText);

        return {
            summary: String(parsed.summary || text || '').trim().slice(0, 240),
            goals: cleanList(parsed.goals),
            skills: cleanList(parsed.skills),
            interests: cleanList(parsed.interests),
            traits: {
                tech: clamp(parsed?.traits?.tech, 0, 1),
                creative: clamp(parsed?.traits?.creative, 0, 1),
                social: clamp(parsed?.traits?.social, 0, 1)
            }
        };
    } catch (error) {
        console.error("Gemini Error - Using Smart Fallback:", error.message);
        return fallbackProfileFromBio(text);
    }
};

const translateViaGoogleTranslateAPI = async (text, targetLanguageCode) => {
    try {
        const result = await translate.translate(text, { to: targetLanguageCode || 'en' });
        return result.text || text;
    } catch (error) {
        console.error('[Google Translate] Error:', error.message);
        return null;
    }
};

const translateViaGemini = async (text, targetLanguageCode) => {
    try {
        if (!genAI) {
            return null;
        }

        const targetLanguage = TRANSLATION_LANGUAGE_LABELS[targetLanguageCode] || 'English';
        
        // Try using the latest available Gemini models
        const modelNames = [
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-2.0-pro",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro-latest",
            "gemini-1.0-pro",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-pro"
        ];
        
        let model = null;
        
        for (const modelName of modelNames) {
            try {
                model = genAI.getGenerativeModel({ model: modelName });
                const testResult = await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: 'test' }] }],
                    generationConfig: { maxOutputTokens: 1 }
                });
                console.log(`✓ Gemini model ${modelName} is available`);
                break;
            } catch (e) {
                console.log(`✗ Gemini model ${modelName} not available`);
                continue;
            }
        }
        
        if (!model) {
            return null;
        }
        
        const prompt = `Translate this message into ${targetLanguage}. Auto-detect the source language. Return ONLY the translated text, no markdown, no explanation, no quotes. If already in ${targetLanguage}, return as-is.

Message: "${text}"`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 256 }
        });
        
        const translated = result.response.text().trim();
        return translated || null;
    } catch (error) {
        console.error('Gemini translation error:', error.message);
        return null;
    }
};

const translateText = async ({ text = '', targetLanguageCode = 'en' }) => {
    const source = String(text || '').trim();
    if (!source) {
        throw new Error('Text to translate cannot be empty');
    }

    // If target is English, no need to translate
    if (targetLanguageCode === 'en') {
        return source;
    }

    try {
        // Try Google Translate API first (most reliable)
        const googleTranslation = await translateViaGoogleTranslateAPI(source, targetLanguageCode);
        if (googleTranslation && googleTranslation !== source) {
            return googleTranslation;
        }

        // Fallback to Gemini API
        const geminiTranslation = await translateViaGemini(source, targetLanguageCode);
        if (geminiTranslation && geminiTranslation !== source) {
            return geminiTranslation;
        }

        // If both fail, return original text
        return source;
    } catch (error) {
        console.error('Translation Error:', error.message);
        return source;
    }
};

module.exports = { extractProfile, translateText, TRANSLATION_LANGUAGE_LABELS };
