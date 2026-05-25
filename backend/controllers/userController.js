const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { extractProfile } = require('../config/aiConfig');
const { buildProfileEmbedding, normalizeList, toVectorString } = require('../services/profileService');
const { getRankedMatches, getUserProfile } = require('../services/matchService');
const { createNotification } = require('../services/notificationService');

const sanitizeUser = (user) => {
    if (!user) {
        return null;
    }

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        raw_bio: user.raw_bio,
        profile_summary: user.profile_summary,
        goals: user.goals,
        skills: user.skills,
        interests: user.interests,
        faculty: user.faculty,
        course: user.course,
        academic_year: user.academic_year,
        profile_visibility: user.profile_visibility,
        profile_photo_url: user.profile_photo_url,
        app_language: user.app_language,
        preferred_chat_language: user.preferred_chat_language,
        intensity_level: user.intensity_level,
        is_onboarded: user.is_onboarded,
        hasCompletedOnboarding: user.is_onboarded
    };
};

const getSafeUserById = async (userId) => {
    const { rows } = await db.query(
        `SELECT id, email, name, raw_bio, profile_summary, goals, skills, interests,
                faculty, course, academic_year, profile_visibility, profile_photo_url,
                app_language, preferred_chat_language,
                intensity_level, is_onboarded
         FROM users
         WHERE id = $1`,
        [userId]
    );

    return sanitizeUser(rows[0]);
};

const buildStoredProfile = async ({
    bio,
    intensity_level,
    existingUser,
    goals = [],
    skills = [],
    interests = [],
    faculty = '',
    course = '',
    academic_year = ''
}) => {
    const providedGoals = normalizeList(goals);
    const providedSkills = normalizeList(skills);
    const providedInterests = normalizeList(interests);
    const structuredBio = [
        faculty ? `faculty ${faculty}` : '',
        course ? `course ${course}` : '',
        academic_year ? `year ${academic_year}` : '',
        providedGoals.length ? `goals ${providedGoals.join(', ')}` : '',
        providedSkills.length ? `skills ${providedSkills.join(', ')}` : '',
        providedInterests.length ? `interests ${providedInterests.join(', ')}` : ''
    ].filter(Boolean).join('. ');
    const nextBio = typeof bio === 'string' && bio.trim()
        ? bio.trim()
        : (structuredBio || existingUser?.raw_bio || '');
    const nextIntensity = intensity_level || existingUser?.intensity_level || 'Dedicated';
    const profile = await extractProfile(nextBio);
    const mergedProfile = {
        summary: profile.summary || structuredBio || 'Ambitious collaborator building meaningful projects.',
        goals: normalizeList([...(profile.goals || []), ...providedGoals]),
        skills: normalizeList([...(profile.skills || []), ...providedSkills]),
        interests: normalizeList([...(profile.interests || []), ...providedInterests]),
        traits: profile.traits
    };

    return {
        summary: mergedProfile.summary,
        goals: mergedProfile.goals,
        skills: mergedProfile.skills,
        interests: mergedProfile.interests,
        traitsVector: `[${profile.traits.tech}, ${profile.traits.creative}, ${profile.traits.social}]`,
        embeddingVector: toVectorString(buildProfileEmbedding(mergedProfile, nextIntensity)),
        rawBio: nextBio,
        intensityLevel: nextIntensity
    };
};

const registerUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await db.query(
            'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, is_onboarded',
            [email, hashedPassword]
        );

        const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(201).json({ ...result.rows[0], token, hasCompletedOnboarding: false });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }
        res.status(500).json({ error: 'Registration failed', details: err.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
            res.status(200).json({
                ...sanitizeUser(user),
                token
            });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
};

const completeOnboarding = async (req, res) => {
    const {
        name,
        intensity_level,
        bio,
        faculty,
        course,
        academic_year,
        profile_visibility,
        profile_photo_url,
        app_language,
        preferred_chat_language,
        goals,
        skills,
        interests
    } = req.body;

    try {
        const storedProfile = await buildStoredProfile({
            bio,
            intensity_level,
            existingUser: null,
            goals,
            skills,
            interests,
            faculty,
            course,
            academic_year
        });

        const result = await db.query(
            `UPDATE users
             SET name = $1,
                 intensity_level = $2,
                 raw_bio = $3,
                 profile_summary = $4,
                 goals = $5::jsonb,
                 skills = $6::jsonb,
                 interests = $7::jsonb,
                 traits = $8,
                 embedding = $9,
                 faculty = $10,
                 course = $11,
                 academic_year = $12,
                 profile_visibility = COALESCE($13, 'public'),
                 profile_photo_url = $14,
                 app_language = COALESCE($15, 'en'),
                 preferred_chat_language = COALESCE($16, COALESCE($15, 'en')),
                 is_onboarded = true
             WHERE id = $17
             RETURNING id, email, name, raw_bio, profile_summary, goals, skills, interests,
                       faculty, course, academic_year, profile_visibility, profile_photo_url,
                       app_language, preferred_chat_language,
                       intensity_level, is_onboarded`,
            [
                name,
                storedProfile.intensityLevel,
                storedProfile.rawBio,
                storedProfile.summary,
                JSON.stringify(storedProfile.goals),
                JSON.stringify(storedProfile.skills),
                JSON.stringify(storedProfile.interests),
                storedProfile.traitsVector,
                storedProfile.embeddingVector,
                faculty || null,
                course || null,
                academic_year || null,
                profile_visibility || 'public',
                profile_photo_url || null,
                app_language || 'en',
                preferred_chat_language || app_language || 'en',
                req.user.id
            ]
        );

        res.json(sanitizeUser(result.rows[0]));
    } catch (error) {
        res.status(500).json({ error: 'Onboarding failed', details: error.message });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const user = await getSafeUserById(req.user.id);
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load profile' });
    }
};

const updateProfile = async (req, res) => {
    const {
        name,
        bio,
        intensity_level,
        faculty,
        course,
        academic_year,
        profile_visibility,
        profile_photo_url,
        app_language,
        preferred_chat_language,
        goals,
        skills,
        interests
    } = req.body;

    try {
        const existingUser = await getUserProfile(req.user.id);
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const shouldRebuildProfile =
            typeof bio === 'string' ||
            Boolean(intensity_level);

        let profileData = {
            summary: existingUser.profile_summary,
            goals: existingUser.goals,
            skills: existingUser.skills,
            interests: existingUser.interests,
            traitsVector: null,
            embeddingVector: existingUser.embedding?.length
                ? toVectorString(existingUser.embedding)
                : null,
            rawBio: existingUser.raw_bio || '',
            intensityLevel: intensity_level || existingUser.intensity_level
        };

        if (shouldRebuildProfile) {
            profileData = await buildStoredProfile({
                bio,
                intensity_level,
                existingUser,
                goals: Array.isArray(goals) ? goals : existingUser.goals,
                skills: Array.isArray(skills) ? skills : existingUser.skills,
                interests: Array.isArray(interests) ? interests : existingUser.interests,
                faculty: faculty || existingUser.faculty || '',
                course: course || existingUser.course || '',
                academic_year: academic_year || existingUser.academic_year || ''
            });
        }

        const { rows } = await db.query(
            `UPDATE users
             SET name = COALESCE($1, name),
                 raw_bio = $2,
                 profile_summary = $3,
                 goals = $4::jsonb,
                 skills = $5::jsonb,
                 interests = $6::jsonb,
                 traits = COALESCE($7, traits),
                 embedding = COALESCE($8, embedding),
                 faculty = $9,
                 course = $10,
                 academic_year = $11,
                 profile_visibility = COALESCE($12, profile_visibility),
                 profile_photo_url = $13,
                 app_language = COALESCE($14, app_language),
                 preferred_chat_language = COALESCE($15, preferred_chat_language),
                 intensity_level = COALESCE($16, intensity_level),
                 is_onboarded = CASE
                     WHEN COALESCE(is_onboarded, false) = true THEN true
                     ELSE true
                 END
             WHERE id = $17
             RETURNING id, email, name, raw_bio, profile_summary, goals, skills, interests,
                       faculty, course, academic_year, profile_visibility, profile_photo_url,
                       app_language, preferred_chat_language,
                       intensity_level, is_onboarded`,
            [
                name || null,
                profileData.rawBio,
                profileData.summary,
                JSON.stringify(profileData.goals || []),
                JSON.stringify(profileData.skills || []),
                JSON.stringify(profileData.interests || []),
                profileData.traitsVector,
                profileData.embeddingVector,
                faculty || null,
                course || null,
                academic_year || null,
                profile_visibility || null,
                profile_photo_url || null,
                app_language || null,
                preferred_chat_language || null,
                profileData.intensityLevel || null,
                req.user.id
            ]
        );

        res.status(200).json(sanitizeUser(rows[0]));
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile', details: error.message });
    }
};

const updateAccountCredentials = async (req, res) => {
    const nextEmail = String(req.body?.email || '').trim().toLowerCase();
    const currentPassword = String(req.body?.current_password || '');
    const newPassword = String(req.body?.new_password || '');

    if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
    }

    if (!nextEmail && !newPassword) {
        return res.status(400).json({ error: 'Provide a new email or a new password' });
    }

    if (newPassword && newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    try {
        const { rows } = await db.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [req.user.id]);
        const user = rows[0];

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const emailToStore = nextEmail || user.email;
        let passwordToStore = user.password;

        if (newPassword) {
            const salt = await bcrypt.genSalt(10);
            passwordToStore = await bcrypt.hash(newPassword, salt);
        }

        const updated = await db.query(
            `UPDATE users
             SET email = $1,
                 password = $2
             WHERE id = $3
             RETURNING id, email, name, raw_bio, profile_summary, goals, skills, interests,
                       faculty, course, academic_year, profile_visibility, profile_photo_url,
                       app_language, preferred_chat_language,
                       intensity_level, is_onboarded`,
            [emailToStore, passwordToStore, req.user.id]
        );

        return res.status(200).json(sanitizeUser(updated.rows[0]));
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'That email is already in use' });
        }
        return res.status(500).json({ error: 'Failed to update account credentials' });
    }
};

const getSmartMatches = async (req, res) => {
    try {
        const currentUser = await getUserProfile(req.user.id);
        if (!currentUser || !currentUser.is_onboarded || !currentUser.embedding.length) {
            return res.status(400).json({ error: 'User not onboarded' });
        }

        const rows = await getRankedMatches(req.user.id, {
            limit: req.query.limit,
            search: req.query.search,
            intensity: req.query.intensity,
            faculty: req.query.faculty,
            course: req.query.course,
            academic_year: req.query.academic_year,
            goal: req.query.goal,
            skill: req.query.skill,
            interest: req.query.interest
        });
        res.status(200).json(rows);
    } catch (error) {
        console.error('Matching Error:', error);
        res.status(500).json({ error: 'Matching failed' });
    }
};

const sendConnectionRequest = async (req, res) => {
    const requesterId = req.user.id;
    const { receiverId } = req.body;

    if (!receiverId) {
        return res.status(400).json({ error: 'receiverId is required' });
    }

    if (requesterId === receiverId) {
        return res.status(400).json({ error: 'You cannot connect with yourself' });
    }

    try {
        const requester = await getSafeUserById(requesterId);
        const receiver = await db.query(
            'SELECT id, name, email FROM users WHERE id = $1 AND is_onboarded = true',
            [receiverId]
        );

        if (!receiver.rows[0]) {
            return res.status(404).json({ error: 'User not found' });
        }

        const existing = await db.query(
            `SELECT *
             FROM connections
             WHERE (requester_id = $1 AND receiver_id = $2)
                OR (requester_id = $2 AND receiver_id = $1)
             LIMIT 1`,
            [requesterId, receiverId]
        );

        if (existing.rows[0]) {
            const relation = existing.rows[0];

            if (relation.status === 'accepted') {
                return res.status(200).json({ message: 'You are already connected', connection: relation });
            }

            if (relation.status === 'pending') {
                if (relation.requester_id === requesterId) {
                    return res.status(200).json({ message: 'Connection request already sent', connection: relation });
                }

                return res.status(409).json({
                    error: 'This user has already sent you a connection request',
                    connection: relation
                });
            }

            const retried = await db.query(
                `UPDATE connections
                 SET requester_id = $1,
                     receiver_id = $2,
                     status = 'pending',
                     created_at = CURRENT_TIMESTAMP,
                     responded_at = NULL
                 WHERE id = $3
                 RETURNING *`,
                [requesterId, receiverId, relation.id]
            );

            await createNotification({
                userId: receiverId,
                type: 'connection_request',
                title: 'New connection request',
                body: `${requester?.name || requester?.email || 'Someone'} wants to connect with you on Cipher.`,
                entityType: 'connection',
                entityId: retried.rows[0].id
            });

            return res.status(200).json({
                message: 'Connection request sent',
                connection: retried.rows[0]
            });
        }

        const created = await db.query(
            `INSERT INTO connections (requester_id, receiver_id, status)
             VALUES ($1, $2, 'pending')
             RETURNING *`,
            [requesterId, receiverId]
        );

        await createNotification({
            userId: receiverId,
            type: 'connection_request',
            title: 'New connection request',
            body: `${requester?.name || requester?.email || 'Someone'} wants to connect with you on Cipher.`,
            entityType: 'connection',
            entityId: created.rows[0].id
        });

        return res.status(201).json({
            message: 'Connection request sent',
            connection: created.rows[0]
        });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to send connection request' });
    }
};

const getPendingRequests = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT c.id, c.status, c.created_at, u.id AS user_id, u.name, u.email,
                    u.intensity_level, u.profile_photo_url
             FROM connections c
             INNER JOIN users u ON u.id = c.requester_id
             WHERE c.receiver_id = $1 AND c.status = 'pending'
             ORDER BY c.created_at DESC`,
            [req.user.id]
        );

        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load pending requests' });
    }
};

const getConnections = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT c.id AS connection_id, c.created_at,
                    u.id AS user_id, u.name, u.email, u.intensity_level,
                    u.profile_summary, u.profile_photo_url
             FROM connections c
             INNER JOIN users u
               ON u.id = CASE
                    WHEN c.requester_id = $1 THEN c.receiver_id
                    ELSE c.requester_id
               END
             WHERE (c.requester_id = $1 OR c.receiver_id = $1)
               AND c.status = 'accepted'
             ORDER BY c.created_at DESC`,
            [req.user.id]
        );

        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load connections' });
    }
};

const respondToConnectionRequest = async (req, res) => {
    const { connectionId } = req.params;
    const { action } = req.body;

    if (!['accepted', 'declined'].includes(action)) {
        return res.status(400).json({ error: "Action must be 'accepted' or 'declined'" });
    }

    try {
        const updated = await db.query(
            `UPDATE connections
             SET status = $1, responded_at = CURRENT_TIMESTAMP
             WHERE id = $2
               AND receiver_id = $3
               AND status = 'pending'
             RETURNING *`,
            [action, connectionId, req.user.id]
        );

        if (!updated.rows[0]) {
            return res.status(404).json({ error: 'Pending request not found' });
        }

        const responder = await getSafeUserById(req.user.id);

        await createNotification({
            userId: updated.rows[0].requester_id,
            type: `connection_${action}`,
            title: action === 'accepted' ? 'Connection accepted' : 'Connection declined',
            body: `${responder?.name || responder?.email || 'Someone'} ${action} your connection request.`,
            entityType: 'connection',
            entityId: updated.rows[0].id
        });

        return res.status(200).json({
            message: `Connection request ${action}`,
            connection: updated.rows[0]
        });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to update connection request' });
    }
};

const getNotifications = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT id, type, title, body, entity_type, entity_id, is_read, created_at
             FROM notifications
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT 50`,
            [req.user.id]
        );

        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load notifications' });
    }
};

const markNotificationRead = async (req, res) => {
    try {
        const { rows } = await db.query(
            `UPDATE notifications
             SET is_read = true
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [req.params.notificationId, req.user.id]
        );

        if (!rows[0]) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notification' });
    }
};

const markAllNotificationsRead = async (req, res) => {
    try {
        await db.query(
            `UPDATE notifications
             SET is_read = true
             WHERE user_id = $1 AND is_read = false`,
            [req.user.id]
        );

        res.status(200).json({ message: 'Notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notifications' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    completeOnboarding,
    getCurrentUser,
    updateProfile,
    updateAccountCredentials,
    getSmartMatches,
    sendConnectionRequest,
    getPendingRequests,
    respondToConnectionRequest,
    getConnections,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead
};
