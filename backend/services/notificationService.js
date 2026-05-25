const db = require('../config/db');

const createNotification = async ({
    userId,
    type,
    title,
    body,
    entityType = null,
    entityId = null
}) => {
    if (!userId || !type || !title) {
        return null;
    }

    const { rows } = await db.query(
        `INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, type, title, body || '', entityType, entityId]
    );

    return rows[0];
};

const createNotificationsForUsers = async (userIds, payload) => {
    const uniqueUserIds = [...new Set((userIds || []).filter(Boolean))];

    if (!uniqueUserIds.length) {
        return [];
    }

    const inserts = uniqueUserIds.map((userId) => createNotification({ ...payload, userId }));
    return Promise.all(inserts);
};

module.exports = {
    createNotification,
    createNotificationsForUsers
};
