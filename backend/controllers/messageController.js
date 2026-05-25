const db = require('../config/db');
const { translateText, TRANSLATION_LANGUAGE_LABELS } = require('../config/aiConfig');
const { createNotification } = require('../services/notificationService');

const getAcceptedConnection = async (userId, otherUserId) => {
    const { rows } = await db.query(
        `SELECT c.id AS connection_id, u.id AS user_id, u.name, u.email, u.intensity_level, u.profile_photo_url
         FROM connections c
         INNER JOIN users u
           ON u.id = CASE
                WHEN c.requester_id = $1 THEN c.receiver_id
                ELSE c.requester_id
           END
         WHERE (
                (c.requester_id = $1 AND c.receiver_id = $2)
                OR (c.requester_id = $2 AND c.receiver_id = $1)
               )
           AND c.status = 'accepted'
         LIMIT 1`,
        [userId, otherUserId]
    );

    return rows[0] || null;
};

const getConversations = async (req, res) => {
    try {
        const { rows } = await db.query(
            `WITH accepted AS (
                SELECT c.id AS connection_id,
                       CASE
                           WHEN c.requester_id = $1 THEN c.receiver_id
                           ELSE c.requester_id
                       END AS other_user_id
                FROM connections c
                WHERE (c.requester_id = $1 OR c.receiver_id = $1)
                  AND c.status = 'accepted'
            ),
            latest AS (
                SELECT DISTINCT ON (CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END)
                    CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END AS other_user_id,
                    m.content AS last_message,
                    m.created_at AS last_message_at,
                    m.sender_id AS last_message_sender_id
                FROM messages m
                WHERE m.sender_id = $1 OR m.receiver_id = $1
                ORDER BY CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END, m.created_at DESC
            ),
            unread AS (
                SELECT m.sender_id AS other_user_id, COUNT(*)::int AS unread_count
                FROM messages m
                WHERE m.receiver_id = $1 AND m.is_read = false
                GROUP BY m.sender_id
            )
            SELECT a.connection_id,
                   u.id AS user_id,
                   u.name,
                   u.email,
                   u.intensity_level,
                   u.profile_photo_url,
                   l.last_message,
                   l.last_message_at,
                   COALESCE(unread.unread_count, 0) AS unread_count,
                   CASE
                       WHEN l.last_message_sender_id = $1 THEN true
                       ELSE false
                   END AS last_message_from_self
            FROM accepted a
            INNER JOIN users u ON u.id = a.other_user_id
            LEFT JOIN latest l ON l.other_user_id = a.other_user_id
            LEFT JOIN unread ON unread.other_user_id = a.other_user_id
            ORDER BY l.last_message_at DESC NULLS LAST, u.name ASC`,
            [req.user.id]
        );

        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load conversations' });
    }
};

const getConversationMessages = async (req, res) => {
    const currentUserId = req.user.id;
    const { userId: otherUserId } = req.params;

    try {
        const connection = await getAcceptedConnection(currentUserId, otherUserId);
        if (!connection) {
            return res.status(404).json({ error: 'Accepted connection not found' });
        }

        const { rows } = await db.query(
            `SELECT id, sender_id, receiver_id, content, is_read, created_at
             FROM messages
             WHERE (sender_id = $1 AND receiver_id = $2)
                OR (sender_id = $2 AND receiver_id = $1)
             ORDER BY created_at ASC`,
            [currentUserId, otherUserId]
        );

        await db.query(
            `UPDATE messages
             SET is_read = true
             WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
            [otherUserId, currentUserId]
        );

        res.status(200).json({
            connection,
            messages: rows.map((message) => ({
                ...message,
                from_self: message.sender_id === currentUserId
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load messages' });
    }
};

const sendMessage = async (req, res) => {
    const currentUserId = req.user.id;
    const { userId: otherUserId } = req.params;
    const content = String(req.body?.content || '').trim();

    if (!content) {
        return res.status(400).json({ error: 'Message content is required' });
    }

    try {
        const connection = await getAcceptedConnection(currentUserId, otherUserId);
        if (!connection) {
            return res.status(404).json({ error: 'Accepted connection not found' });
        }

        const { rows } = await db.query(
            `INSERT INTO messages (sender_id, receiver_id, content)
             VALUES ($1, $2, $3)
             RETURNING id, sender_id, receiver_id, content, is_read, created_at`,
            [currentUserId, otherUserId, content]
        );

        await createNotification({
            userId: otherUserId,
            type: 'message',
            title: `New message from ${connection.name || 'your connection'}`,
            body: content.slice(0, 120),
            entityType: 'message',
            entityId: rows[0].id
        });

        res.status(201).json({
            message: {
                ...rows[0],
                from_self: true
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
};

const translateMessage = async (req, res) => {
    const text = String(req.body?.text || '').trim();
    const targetLanguageCode = String(req.body?.targetLanguageCode || 'en').trim().toLowerCase();

    if (!text) {
        return res.status(400).json({ error: 'Text is required for translation' });
    }

    if (!TRANSLATION_LANGUAGE_LABELS[targetLanguageCode]) {
        return res.status(400).json({ 
            error: `Unsupported language. Supported: ${Object.keys(TRANSLATION_LANGUAGE_LABELS).join(', ')}` 
        });
    }

    try {
        const translation = await translateText({ text, targetLanguageCode });
        res.status(200).json({ translation });
    } catch (error) {
        console.error('Translation endpoint error:', error.message);
        res.status(503).json({ 
            error: error.message || 'Translation service temporarily unavailable. Please try again later.' 
        });
    }
};

module.exports = {
    getConversations,
    getConversationMessages,
    sendMessage,
    translateMessage
};
