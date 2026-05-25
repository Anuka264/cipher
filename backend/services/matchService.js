const db = require('../config/db');
const {
    computeMatchScore,
    normalizeList,
    parseVector,
    toVectorString
} = require('./profileService');

const normalizeProfileRow = (row) => ({
    ...row,
    goals: normalizeList(row.goals),
    skills: normalizeList(row.skills),
    interests: normalizeList(row.interests),
    embedding: parseVector(row.embedding)
});

const getUserProfile = async (userId) => {
    const { rows } = await db.query(
        `SELECT id, email, name, intensity_level, raw_bio, profile_summary,
                goals, skills, interests, faculty, course, academic_year,
                profile_visibility, profile_photo_url, embedding, is_onboarded
         FROM users
         WHERE id = $1`,
        [userId]
    );

    if (!rows[0]) {
        return null;
    }

    return normalizeProfileRow(rows[0]);
};

const includesToken = (values, token) => {
    if (!token) {
        return true;
    }

    const loweredToken = String(token).toLowerCase();
    return (values || []).some((value) => String(value).toLowerCase().includes(loweredToken));
};

const matchesFilters = (candidate, filters) => {
    if (!filters) {
        return true;
    }

    const searchable = [
        candidate.name,
        candidate.email,
        candidate.profile_summary,
        candidate.faculty,
        candidate.course,
        ...(candidate.goals || []),
        ...(candidate.skills || []),
        ...(candidate.interests || [])
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    if (filters.search && !searchable.includes(String(filters.search).toLowerCase())) {
        return false;
    }

    if (filters.intensity && String(candidate.intensity_level).toLowerCase() !== String(filters.intensity).toLowerCase()) {
        return false;
    }

    if (filters.faculty && String(candidate.faculty || '').toLowerCase() !== String(filters.faculty).toLowerCase()) {
        return false;
    }

    if (filters.course && String(candidate.course || '').toLowerCase() !== String(filters.course).toLowerCase()) {
        return false;
    }

    if (filters.academic_year && String(candidate.academic_year || '').toLowerCase() !== String(filters.academic_year).toLowerCase()) {
        return false;
    }

    if (!includesToken(candidate.goals, filters.goal)) {
        return false;
    }

    if (!includesToken(candidate.skills, filters.skill)) {
        return false;
    }

    if (!includesToken(candidate.interests, filters.interest)) {
        return false;
    }

    return true;
};

const getRankedMatches = async (userId, options = {}) => {
    const currentUser = await getUserProfile(userId);

    if (!currentUser || !currentUser.is_onboarded || !currentUser.embedding.length) {
        return [];
    }

    const numericLimit = Number.parseInt(options.limit, 10);
    const limit = Number.isFinite(numericLimit) ? Math.min(Math.max(numericLimit, 1), 50) : 10;
    const embeddingString = toVectorString(currentUser.embedding);
    const shortlistSize = Math.max(limit * 8, 24);

    const { rows } = await db.query(
        `SELECT users.id, users.name, users.email, users.intensity_level,
                users.profile_summary, users.goals, users.skills, users.interests,
                users.faculty, users.course, users.academic_year, users.profile_visibility,
                users.profile_photo_url, users.embedding,
                c.id AS connection_id,
                c.status AS connection_status,
                CASE
                    WHEN c.receiver_id = $2 AND c.status = 'pending' THEN true
                    ELSE false
                END AS has_incoming_request
         FROM users
         LEFT JOIN connections c
           ON (
               (c.requester_id = users.id AND c.receiver_id = $2)
               OR
               (c.requester_id = $2 AND c.receiver_id = users.id)
           )
         WHERE users.is_onboarded = true
           AND users.id != $2
           AND users.embedding IS NOT NULL
           AND COALESCE(users.profile_visibility, 'public') != 'private'
         ORDER BY users.embedding <=> $1::vector
         LIMIT $3`,
        [embeddingString, userId, shortlistSize]
    );

    return rows
        .map((row) => {
            const candidate = normalizeProfileRow(row);
            const scoring = computeMatchScore(currentUser, candidate);

            return {
                id: candidate.id,
                name: candidate.name,
                email: candidate.email,
                intensity_level: candidate.intensity_level,
                profile_summary: candidate.profile_summary,
                goals: candidate.goals,
                skills: candidate.skills,
                interests: candidate.interests,
                faculty: candidate.faculty,
                course: candidate.course,
                academic_year: candidate.academic_year,
                profile_photo_url: candidate.profile_photo_url,
                connection_id: candidate.connection_id,
                connection_status: candidate.connection_status,
                has_incoming_request: candidate.has_incoming_request,
                ...scoring
            };
        })
        .filter((candidate) => matchesFilters(candidate, options))
        .sort((left, right) => right.match_percentage - left.match_percentage)
        .slice(0, limit);
};

module.exports = {
    getRankedMatches,
    getUserProfile
};
