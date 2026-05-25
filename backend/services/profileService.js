const intensityMap = {
    casual: 0.35,
    dedicated: 0.7,
    vanguard: 1.0
};

const keywordWeights = {
    tech: [
        'javascript', 'typescript', 'react', 'node', 'python', 'java',
        'docker', 'kubernetes', 'devops', 'backend', 'frontend', 'ai',
        'machine learning', 'data', 'cloud', 'api', 'database'
    ],
    creative: [
        'design', 'figma', 'art', 'content', 'video', 'brand',
        'ux', 'ui', 'writing', 'storytelling', 'creative'
    ],
    social: [
        'community', 'leadership', 'teamwork', 'networking', 'mentor',
        'event', 'club', 'public speaking', 'collaboration'
    ],
    builder: [
        'startup', 'project', 'hackathon', 'prototype', 'product',
        'build', 'launch', 'portfolio'
    ],
    research: [
        'research', 'paper', 'innovation', 'lab', 'analysis', 'experiment'
    ],
    impact: [
        'social impact', 'community', 'ngo', 'education', 'health',
        'sustainability'
    ]
};

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const normalizeList = (values = []) =>
    [...new Set(
        (Array.isArray(values) ? values : [])
            .map((value) => String(value || '').trim().toLowerCase())
            .filter(Boolean)
    )];

const parseVector = (value) => {
    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {
        return value.map(Number);
    }

    return String(value)
        .replace(/^\[/, '')
        .replace(/\]$/, '')
        .split(',')
        .map((entry) => Number(entry.trim()))
        .filter((entry) => !Number.isNaN(entry));
};

const toVectorString = (values) => `[${values.map((value) => value.toFixed(6)).join(',')}]`;

const countKeywordHits = (text, keywords) =>
    keywords.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0);

const normalizeVector = (values) => {
    const magnitude = Math.sqrt(values.reduce((sum, value) => sum + (value * value), 0));
    if (!magnitude) {
        return values;
    }

    return values.map((value) => value / magnitude);
};

const buildProfileEmbedding = ({ summary = '', goals = [], skills = [], interests = [], traits = {} }, intensityLevel = '') => {
    const combinedText = [summary, ...goals, ...skills, ...interests].join(' ').toLowerCase();
    const normalizedGoals = normalizeList(goals);
    const normalizedSkills = normalizeList(skills);
    const normalizedInterests = normalizeList(interests);

    const dims = [
        clamp(Number(traits.tech) || 0.45),
        clamp(Number(traits.creative) || 0.45),
        clamp(Number(traits.social) || 0.45),
        clamp(countKeywordHits(combinedText, keywordWeights.builder) / 4, 0, 1),
        clamp(countKeywordHits(combinedText, keywordWeights.research) / 3, 0, 1),
        clamp(countKeywordHits(combinedText, keywordWeights.impact) / 3, 0, 1),
        clamp(normalizedGoals.length / 6, 0, 1),
        clamp(normalizedSkills.length / 8, 0, 1),
        clamp(normalizedInterests.length / 8, 0, 1),
        intensityMap[String(intensityLevel || '').toLowerCase()] || 0.5,
        clamp(countKeywordHits(combinedText, keywordWeights.tech) / 6, 0, 1),
        clamp(countKeywordHits(combinedText, keywordWeights.social) / 5, 0, 1)
    ];

    return normalizeVector(dims);
};

const cosineSimilarity = (left, right) => {
    const leftVector = parseVector(left);
    const rightVector = parseVector(right);

    if (!leftVector.length || !rightVector.length || leftVector.length !== rightVector.length) {
        return 0;
    }

    const dot = leftVector.reduce((sum, value, index) => sum + (value * rightVector[index]), 0);
    const leftMagnitude = Math.sqrt(leftVector.reduce((sum, value) => sum + value * value, 0));
    const rightMagnitude = Math.sqrt(rightVector.reduce((sum, value) => sum + value * value, 0));

    if (!leftMagnitude || !rightMagnitude) {
        return 0;
    }

    return dot / (leftMagnitude * rightMagnitude);
};

const jaccardSimilarity = (left, right) => {
    const leftSet = new Set(normalizeList(left));
    const rightSet = new Set(normalizeList(right));

    if (!leftSet.size && !rightSet.size) {
        return 0;
    }

    const intersection = [...leftSet].filter((item) => rightSet.has(item)).length;
    const union = new Set([...leftSet, ...rightSet]).size;

    return union ? intersection / union : 0;
};

const sharedItems = (left, right, limit = 3) =>
    normalizeList(left).filter((item) => normalizeList(right).includes(item)).slice(0, limit);

const intensityCompatibility = (left, right) => {
    const leftValue = intensityMap[String(left || '').toLowerCase()] || 0.5;
    const rightValue = intensityMap[String(right || '').toLowerCase()] || 0.5;
    const difference = Math.abs(leftValue - rightValue);
    return clamp(1 - difference, 0, 1);
};

const roundScore = (value) => Math.round(value * 10) / 10;

const computeMatchScore = (currentUser, candidate) => {
    const semantic = ((cosineSimilarity(currentUser.embedding, candidate.embedding) + 1) / 2) * 100;
    const goalScore = jaccardSimilarity(currentUser.goals, candidate.goals) * 100;
    const skillScore = jaccardSimilarity(currentUser.skills, candidate.skills) * 100;
    const interestScore = jaccardSimilarity(currentUser.interests, candidate.interests) * 100;
    const intensityScore = intensityCompatibility(currentUser.intensity_level, candidate.intensity_level) * 100;

    const total =
        semantic * 0.55 +
        goalScore * 0.2 +
        skillScore * 0.15 +
        interestScore * 0.05 +
        intensityScore * 0.05;

    const sharedGoals = sharedItems(currentUser.goals, candidate.goals);
    const sharedSkills = sharedItems(currentUser.skills, candidate.skills);
    const sharedInterests = sharedItems(currentUser.interests, candidate.interests);
    const sharedContext = [
        ...sharedGoals.map((goal) => `Shared goal: ${goal}`),
        ...sharedSkills.map((skill) => `Shared skill: ${skill}`),
        ...sharedInterests.map((interest) => `Shared interest: ${interest}`)
    ].slice(0, 4);

    return {
        match_percentage: roundScore(total),
        score_breakdown: {
            semantic: roundScore(semantic),
            goals: roundScore(goalScore),
            skills: roundScore(skillScore),
            interests: roundScore(interestScore),
            intensity: roundScore(intensityScore)
        },
        shared_context: sharedContext
    };
};

module.exports = {
    buildProfileEmbedding,
    computeMatchScore,
    normalizeList,
    parseVector,
    toVectorString
};
