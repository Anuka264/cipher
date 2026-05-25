const db = require('../config/db');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const { getRankedMatches, getUserProfile } = require('../services/matchService');

exports.getOracleAdvice = async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await getUserProfile(userId);

        if (!user || !user.embedding.length) {
            return res.status(400).json({ error: "Complete onboarding before consulting the Oracle." });
        }

        const matches = await getRankedMatches(userId, 2);

        if (!matches.length) {
            return res.status(200).json({
                advice: "You are onboarded, but there are no other matching users yet.",
                matches: []
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const explanationPrompt = `User ${user.name} has summary "${user.profile_summary}".
                                   They matched with ${matches[0].name} at ${matches[0].match_percentage}% compatibility.
                                   Shared context: ${matches[0].shared_context.join('; ') || 'strong semantic fit'}.
                                   Explain in one short, encouraging sentence why they should collaborate.`;
        
        const aiResult = await model.generateContent(explanationPrompt);
        
        res.status(200).json({
            advice: aiResult.response.text(),
            matches: matches
        });

    } catch (error) {
        res.status(500).json({ error: "The Oracle is unavailable." });
    }
};
