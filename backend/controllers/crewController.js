const db = require('../config/db');
const { createNotification, createNotificationsForUsers } = require('../services/notificationService');

const TASK_STATUSES = new Set(['todo', 'in_progress', 'done']);
const MEMBER_ROLES = new Set(['admin', 'member']);

const assertCrewMembership = async (crewId, userId) => {
    const { rows } = await db.query(
        `SELECT cm.crew_id, cm.role, u.name, u.email
         FROM crew_members cm
         INNER JOIN users u ON u.id = cm.user_id
         WHERE cm.crew_id = $1 AND cm.user_id = $2
         LIMIT 1`,
        [crewId, userId]
    );

    return rows[0] || null;
};

const createCrewActivity = async ({
    crewId,
    actorId,
    actionType,
    entityType,
    entityId = null,
    summary,
    meta = {}
}) => {
    if (!crewId || !actorId || !actionType || !entityType || !summary) {
        return null;
    }

    const { rows } = await db.query(
        `INSERT INTO crew_activity (crew_id, actor_id, action_type, entity_type, entity_id, summary, meta)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
         RETURNING *`,
        [crewId, actorId, actionType, entityType, entityId, summary, JSON.stringify(meta || {})]
    );

    return rows[0];
};

const getCrewActivity = async (crewId, limit = 40) => {
    const { rows } = await db.query(
        `SELECT a.id,
                a.action_type,
                a.entity_type,
                a.entity_id,
                a.summary,
                a.meta,
                a.created_at,
                u.id AS actor_id,
                u.name AS actor_name,
                u.email AS actor_email,
                u.profile_photo_url AS actor_photo
         FROM crew_activity a
         LEFT JOIN users u ON u.id = a.actor_id
         WHERE a.crew_id = $1
         ORDER BY a.created_at DESC
         LIMIT $2`,
        [crewId, limit]
    );

    return rows;
};

const notifyCrewMembers = async (crewId, actorId, payload) => {
    const { rows } = await db.query(
        `SELECT user_id
         FROM crew_members
         WHERE crew_id = $1 AND user_id != $2`,
        [crewId, actorId]
    );

    return createNotificationsForUsers(
        rows.map((row) => row.user_id),
        payload
    );
};

const getCrewBase = async (crewId) => {
    const { rows } = await db.query(
        `SELECT c.id, c.name, c.purpose, c.created_at, c.created_by,
                creator.name AS creator_name,
                creator.email AS creator_email
         FROM crews c
         LEFT JOIN users creator ON creator.id = c.created_by
         WHERE c.id = $1
         LIMIT 1`,
        [crewId]
    );

    return rows[0] || null;
};

const getCrewMembers = async (crewId) => {
    const { rows } = await db.query(
        `SELECT u.id, u.name, u.email, u.intensity_level, u.profile_photo_url, cm.role, cm.joined_at
         FROM crew_members cm
         INNER JOIN users u ON u.id = cm.user_id
         WHERE cm.crew_id = $1
         ORDER BY CASE WHEN cm.role = 'admin' THEN 0 ELSE 1 END, cm.joined_at ASC`,
        [crewId]
    );

    return rows;
};

const getCrewTasks = async (crewId) => {
    const { rows } = await db.query(
        `SELECT t.id, t.title, t.status, t.due_date, t.created_at,
                u.id AS assigned_to, u.name AS assigned_to_name
         FROM tasks t
         LEFT JOIN users u ON u.id = t.assigned_to
         WHERE t.crew_id = $1
         ORDER BY
           CASE t.status WHEN 'todo' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
           t.created_at DESC`,
        [crewId]
    );

    return rows;
};

const getCrewEvents = async (crewId) => {
    const { rows } = await db.query(
        `SELECT id, title, location, event_date, created_at
         FROM events
         WHERE crew_id = $1
         ORDER BY event_date ASC`,
        [crewId]
    );

    return rows;
};

const getCrewMilestones = async (crewId) => {
    const { rows } = await db.query(
        `SELECT id, title, is_achieved, created_at
         FROM milestones
         WHERE crew_id = $1
         ORDER BY is_achieved ASC, created_at ASC`,
        [crewId]
    );

    return rows;
};

const getMyCrews = async (req, res) => {
    const userId = req.user.id;

    try {
        const { rows } = await db.query(
            `SELECT c.id,
                    c.name,
                    c.purpose,
                    c.created_at,
                    cm.role,
                    COUNT(DISTINCT m.user_id)::int AS member_count,
                    COUNT(DISTINCT t.id)::int AS task_count,
                    COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END)::int AS completed_task_count,
                    COUNT(DISTINCT ms.id)::int AS milestone_count
             FROM crews c
             INNER JOIN crew_members cm ON cm.crew_id = c.id
             LEFT JOIN crew_members m ON m.crew_id = c.id
             LEFT JOIN tasks t ON t.crew_id = c.id
             LEFT JOIN milestones ms ON ms.crew_id = c.id
             WHERE cm.user_id = $1
             GROUP BY c.id, cm.role
             ORDER BY c.created_at DESC`,
            [userId]
        );

        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch crews' });
    }
};

const createCrew = async (req, res) => {
    const { name, purpose } = req.body;
    const userId = req.user.id;

    if (!name) {
        return res.status(400).json({ error: 'Crew name is required' });
    }

    try {
        const newCrew = await db.query(
            `INSERT INTO crews (name, purpose, created_by)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [name, purpose || '', userId]
        );

        await db.query(
            'INSERT INTO crew_members (user_id, crew_id, role) VALUES ($1, $2, $3)',
            [userId, newCrew.rows[0].id, 'admin']
        );

        await createCrewActivity({
            crewId: newCrew.rows[0].id,
            actorId: userId,
            actionType: 'created',
            entityType: 'crew',
            entityId: newCrew.rows[0].id,
            summary: `created the crew ${name}`,
            meta: { crew_name: name }
        });

        res.status(201).json(newCrew.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const joinCrew = async (req, res) => {
    const { crewId } = req.params;
    const userId = req.user.id;

    try {
        const existingMembership = await assertCrewMembership(crewId, userId);
        if (existingMembership) {
            return res.status(400).json({ error: 'You are already a member of this crew.' });
        }

        const crew = await getCrewBase(crewId);
        if (!crew) {
            return res.status(404).json({ error: 'Crew not found' });
        }

        await db.query(
            'INSERT INTO crew_members (user_id, crew_id, role) VALUES ($1, $2, $3)',
            [userId, crewId, 'member']
        );

        await createCrewActivity({
            crewId,
            actorId: userId,
            actionType: 'joined',
            entityType: 'member',
            entityId: userId,
            summary: `joined the crew ${crew.name}`,
            meta: { crew_name: crew.name }
        });

        res.status(200).json({ message: 'Joined successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
};

const getCrewDashboard = async (req, res) => {
    const { crewId } = req.params;
    const userId = req.user.id;

    try {
        const membership = await assertCrewMembership(crewId, userId);
        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this crew' });
        }

        const [crew, members, tasks, events, milestones, recentActivity] = await Promise.all([
            getCrewBase(crewId),
            getCrewMembers(crewId),
            getCrewTasks(crewId),
            getCrewEvents(crewId),
            getCrewMilestones(crewId),
            getCrewActivity(crewId, 8)
        ]);

        if (!crew) {
            return res.status(404).json({ error: 'Crew not found' });
        }

        res.status(200).json({
            crew,
            membership,
            members,
            tasks,
            events,
            milestones,
            recent_activity: recentActivity
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load crew dashboard' });
    }
};

const addCrewMember = async (req, res) => {
    const { crewId } = req.params;
    const actorId = req.user.id;
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email) {
        return res.status(400).json({ error: 'Member email is required' });
    }

    try {
        const membership = await assertCrewMembership(crewId, actorId);
        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this crew' });
        }

        // Only admins can send join requests on behalf of others
        if (membership.role !== 'admin') {
            return res.status(403).json({ error: 'Only crew admins can invite members' });
        }

        const crew = await getCrewBase(crewId);
        const { rows: userRows } = await db.query(
            `SELECT id, name, email
             FROM users
             WHERE LOWER(email) = $1
             LIMIT 1`,
            [email]
        );

        if (!userRows[0]) {
            return res.status(404).json({ error: 'User with that email was not found' });
        }

        const targetUser = userRows[0];
        
        // Check if already a member
        const existing = await assertCrewMembership(crewId, targetUser.id);
        if (existing) {
            return res.status(400).json({ error: 'That user is already in this crew' });
        }

        // Check for pending request
        const { rows: pendingRows } = await db.query(
            `SELECT id FROM crew_join_requests
             WHERE crew_id = $1 AND user_id = $2 AND status = 'pending'
             LIMIT 1`,
            [crewId, targetUser.id]
        );

        if (pendingRows.length > 0) {
            return res.status(400).json({ error: 'A join request is already pending for this user' });
        }

        // Create join request
        const { rows } = await db.query(
            `INSERT INTO crew_join_requests (user_id, crew_id, requested_by, status)
             VALUES ($1, $2, $3, 'pending')
             RETURNING id, user_id, crew_id, status, created_at`,
            [targetUser.id, crewId, actorId]
        );

        await createCrewActivity({
            crewId,
            actorId,
            actionType: 'join_request_sent',
            entityType: 'member',
            entityId: targetUser.id,
            summary: `sent a join request to ${targetUser.name || targetUser.email}`,
            meta: {
                member_email: targetUser.email,
                member_name: targetUser.name
            }
        });

        await createNotification({
            userId: targetUser.id,
            type: 'crew_join_request',
            title: `Join request to ${crew?.name}`,
            body: `${membership.name || membership.email} invited you to join ${crew?.name || 'a crew'}.`,
            entityType: 'crew',
            entityId: crewId
        });

        res.status(201).json({
            ...rows[0],
            user: targetUser,
            message: 'Join request sent successfully'
        });
    } catch (error) {
        console.error('Error adding crew member:', error);
        res.status(500).json({ error: 'Failed to send join request' });
    }
};

const removeCrewMember = async (req, res) => {
    const { crewId, memberUserId } = req.params;
    const actorId = req.user.id;

    try {
        const actorMembership = await assertCrewMembership(crewId, actorId);
        if (!actorMembership) {
            return res.status(403).json({ error: 'You are not a member of this crew' });
        }

        const targetMembership = await assertCrewMembership(crewId, memberUserId);
        if (!targetMembership) {
            return res.status(404).json({ error: 'Crew member not found' });
        }

        // Allow member to leave themselves
        const isLeavingSelf = actorId === memberUserId;

        // If removing someone else, actor must be admin
        if (!isLeavingSelf && actorMembership.role !== 'admin') {
            return res.status(403).json({ error: 'Only crew admins can remove members' });
        }

        // Check crew has at least 2 members before removing
        const { rows: countRows } = await db.query(
            `SELECT COUNT(*)::int AS total_members
             FROM crew_members
             WHERE crew_id = $1`,
            [crewId]
        );

        if ((countRows[0]?.total_members || 0) <= 1) {
            return res.status(400).json({ error: 'Cannot remove the last crew member' });
        }

        await db.query(
            `DELETE FROM crew_members
             WHERE crew_id = $1 AND user_id = $2`,
            [crewId, memberUserId]
        );

        await createCrewActivity({
            crewId,
            actorId,
            actionType: isLeavingSelf ? 'member_left' : 'member_removed',
            entityType: 'member',
            entityId: memberUserId,
            summary: isLeavingSelf 
                ? `${targetMembership.name || targetMembership.email} left the crew`
                : `${actorMembership.name || actorMembership.email} removed ${targetMembership.name || targetMembership.email} from the crew`,
            meta: {
                member_email: targetMembership.email,
                member_name: targetMembership.name,
                role: targetMembership.role,
                is_self_removal: isLeavingSelf
            }
        });

        if (!isLeavingSelf) {
            await createNotification({
                userId: memberUserId,
                type: 'crew_member_removed',
                title: 'You were removed from a crew',
                body: `${actorMembership.name || actorMembership.email} removed you from the crew.`,
                entityType: 'crew',
                entityId: crewId
            });
        }

        res.status(200).json({ message: isLeavingSelf ? 'You have left the crew' : 'Member removed successfully' });
    } catch (error) {
        console.error('Error removing crew member:', error);
        res.status(500).json({ error: 'Failed to remove crew member' });
    }
};

const createTask = async (req, res) => {
    const { crewId } = req.params;
    const { title, assigned_to, due_date } = req.body;
    const userId = req.user.id;

    if (!title) {
        return res.status(400).json({ error: 'Task title is required' });
    }

    try {
        const membership = await assertCrewMembership(crewId, userId);
        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this crew' });
        }

        const { rows } = await db.query(
            `INSERT INTO tasks (crew_id, title, assigned_to, due_date)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [crewId, title, assigned_to || null, due_date || null]
        );

        await createCrewActivity({
            crewId,
            actorId: userId,
            actionType: 'task_created',
            entityType: 'task',
            entityId: rows[0].id,
            summary: `created task "${title}"`,
            meta: { title, due_date: due_date || null }
        });

        await notifyCrewMembers(crewId, userId, {
            type: 'crew_task',
            title: 'New crew task',
            body: `A new task was added: ${title}`,
            entityType: 'task',
            entityId: rows[0].id
        });

        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
};

const updateTask = async (req, res) => {
    const { crewId, taskId } = req.params;
    const { status, assigned_to, due_date, title } = req.body;
    const userId = req.user.id;

    if (status && !TASK_STATUSES.has(status)) {
        return res.status(400).json({ error: 'Invalid task status' });
    }

    try {
        const membership = await assertCrewMembership(crewId, userId);
        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this crew' });
        }

        const { rows } = await db.query(
            `UPDATE tasks
             SET status = COALESCE($1, status),
                 assigned_to = COALESCE($2, assigned_to),
                 due_date = COALESCE($3, due_date),
                 title = COALESCE($4, title)
             WHERE id = $5 AND crew_id = $6
             RETURNING *`,
            [status || null, assigned_to || null, due_date || null, title || null, taskId, crewId]
        );

        if (!rows[0]) {
            return res.status(404).json({ error: 'Task not found' });
        }

        await createCrewActivity({
            crewId,
            actorId: userId,
            actionType: 'task_updated',
            entityType: 'task',
            entityId: rows[0].id,
            summary: `updated task "${rows[0].title}"`,
            meta: {
                title: rows[0].title,
                status: rows[0].status,
                due_date: rows[0].due_date
            }
        });

        await notifyCrewMembers(crewId, userId, {
            type: 'crew_task_update',
            title: 'Crew task updated',
            body: `Task "${rows[0].title}" is now ${rows[0].status}.`,
            entityType: 'task',
            entityId: rows[0].id
        });

        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
};

const deleteTask = async (req, res) => {
    const { crewId, taskId } = req.params;
    const userId = req.user.id;

    try {
        const membership = await assertCrewMembership(crewId, userId);
        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this crew' });
        }

        const { rows } = await db.query(
            `DELETE FROM tasks
             WHERE id = $1 AND crew_id = $2
             RETURNING *`,
            [taskId, crewId]
        );

        if (!rows[0]) {
            return res.status(404).json({ error: 'Task not found' });
        }

        await createCrewActivity({
            crewId,
            actorId: userId,
            actionType: 'task_deleted',
            entityType: 'task',
            entityId: rows[0].id,
            summary: `deleted task "${rows[0].title}"`,
            meta: { title: rows[0].title }
        });

        res.status(200).json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
};

const createEvent = async (req, res) => {
    const { crewId } = req.params;
    const { title, location, event_date } = req.body;
    const userId = req.user.id;

    if (!title || !event_date) {
        return res.status(400).json({ error: 'Event title and date are required' });
    }

    try {
        const membership = await assertCrewMembership(crewId, userId);
        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this crew' });
        }

        const { rows } = await db.query(
            `INSERT INTO events (crew_id, title, location, event_date)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [crewId, title, location || '', event_date]
        );

        await createCrewActivity({
            crewId,
            actorId: userId,
            actionType: 'event_created',
            entityType: 'event',
            entityId: rows[0].id,
            summary: `scheduled event "${title}"`,
            meta: { title, location: location || '', event_date }
        });

        await notifyCrewMembers(crewId, userId, {
            type: 'crew_event',
            title: 'New crew event',
            body: `${title} was scheduled for your crew.`,
            entityType: 'event',
            entityId: rows[0].id
        });

        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create event' });
    }
};

const deleteEvent = async (req, res) => {
    const { crewId, eventId } = req.params;
    const userId = req.user.id;

    try {
        const membership = await assertCrewMembership(crewId, userId);
        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this crew' });
        }

        const { rows } = await db.query(
            `DELETE FROM events
             WHERE id = $1 AND crew_id = $2
             RETURNING *`,
            [eventId, crewId]
        );

        if (!rows[0]) {
            return res.status(404).json({ error: 'Event not found' });
        }

        await createCrewActivity({
            crewId,
            actorId: userId,
            actionType: 'event_deleted',
            entityType: 'event',
            entityId: rows[0].id,
            summary: `deleted event "${rows[0].title}"`,
            meta: { title: rows[0].title, event_date: rows[0].event_date }
        });

        res.status(200).json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete event' });
    }
};

const createMilestone = async (req, res) => {
    const { crewId } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    if (!title) {
        return res.status(400).json({ error: 'Milestone title is required' });
    }

    try {
        const membership = await assertCrewMembership(crewId, userId);
        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this crew' });
        }

        const { rows } = await db.query(
            `INSERT INTO milestones (crew_id, title)
             VALUES ($1, $2)
             RETURNING *`,
            [crewId, title]
        );

        await createCrewActivity({
            crewId,
            actorId: userId,
            actionType: 'milestone_created',
            entityType: 'milestone',
            entityId: rows[0].id,
            summary: `created milestone "${title}"`,
            meta: { title }
        });

        await notifyCrewMembers(crewId, userId, {
            type: 'crew_milestone',
            title: 'New crew milestone',
            body: `A new milestone was added: ${title}`,
            entityType: 'milestone',
            entityId: rows[0].id
        });

        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create milestone' });
    }
};

const updateMilestone = async (req, res) => {
    const { crewId, milestoneId } = req.params;
    const { is_achieved, title } = req.body;
    const userId = req.user.id;

    try {
        const membership = await assertCrewMembership(crewId, userId);
        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this crew' });
        }

        const { rows } = await db.query(
            `UPDATE milestones
             SET is_achieved = COALESCE($1, is_achieved),
                 title = COALESCE($2, title)
             WHERE id = $3 AND crew_id = $4
             RETURNING *`,
            [typeof is_achieved === 'boolean' ? is_achieved : null, title || null, milestoneId, crewId]
        );

        if (!rows[0]) {
            return res.status(404).json({ error: 'Milestone not found' });
        }

        await createCrewActivity({
            crewId,
            actorId: userId,
            actionType: 'milestone_updated',
            entityType: 'milestone',
            entityId: rows[0].id,
            summary: rows[0].is_achieved
                ? `marked milestone "${rows[0].title}" as achieved`
                : `reopened milestone "${rows[0].title}"`,
            meta: { title: rows[0].title, is_achieved: rows[0].is_achieved }
        });

        await notifyCrewMembers(crewId, userId, {
            type: 'crew_milestone_update',
            title: rows[0].is_achieved ? 'Milestone achieved' : 'Milestone reopened',
            body: `Milestone "${rows[0].title}" is now ${rows[0].is_achieved ? 'achieved' : 'open'}.`,
            entityType: 'milestone',
            entityId: rows[0].id
        });

        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update milestone' });
    }
};

const deleteMilestone = async (req, res) => {
    const { crewId, milestoneId } = req.params;
    const userId = req.user.id;

    try {
        const membership = await assertCrewMembership(crewId, userId);
        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this crew' });
        }

        const { rows } = await db.query(
            `DELETE FROM milestones
             WHERE id = $1 AND crew_id = $2
             RETURNING *`,
            [milestoneId, crewId]
        );

        if (!rows[0]) {
            return res.status(404).json({ error: 'Milestone not found' });
        }

        await createCrewActivity({
            crewId,
            actorId: userId,
            actionType: 'milestone_deleted',
            entityType: 'milestone',
            entityId: rows[0].id,
            summary: `deleted milestone "${rows[0].title}"`,
            meta: { title: rows[0].title, is_achieved: rows[0].is_achieved }
        });

        res.status(200).json({ message: 'Milestone deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete milestone' });
    }
};

const getCrewHistory = async (req, res) => {
    const { crewId } = req.params;
    const userId = req.user.id;

    try {
        const membership = await assertCrewMembership(crewId, userId);
        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this crew' });
        }

        const activity = await getCrewActivity(crewId, 60);
        res.status(200).json(activity);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load crew history' });
    }
};

// ===== JOIN REQUEST HANDLERS =====

const getJoinRequests = async (req, res) => {
    const { crewId } = req.params;
    const userId = req.user.id;

    try {
        const membership = await assertCrewMembership(crewId, userId);
        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this crew' });
        }

        // Only admins can view join requests
        if (membership.role !== 'admin') {
            return res.status(403).json({ error: 'Only crew admins can view join requests' });
        }

        const { rows } = await db.query(
            `SELECT jr.id, jr.user_id, jr.status, jr.created_at, 
                    u.name, u.email, u.profile_photo_url, u.intensity_level
             FROM crew_join_requests jr
             INNER JOIN users u ON u.id = jr.user_id
             WHERE jr.crew_id = $1 AND jr.status = 'pending'
             ORDER BY jr.created_at ASC`,
            [crewId]
        );

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching join requests:', error);
        res.status(500).json({ error: 'Failed to load join requests' });
    }
};

const approveJoinRequest = async (req, res) => {
    const { crewId, requestId } = req.params;
    const userId = req.user.id;

    try {
        const membership = await assertCrewMembership(crewId, userId);
        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this crew' });
        }

        // Only admins can approve requests
        if (membership.role !== 'admin') {
            return res.status(403).json({ error: 'Only crew admins can approve join requests' });
        }

        // Get the join request
        const { rows: requestRows } = await db.query(
            `SELECT jr.id, jr.user_id, jr.crew_id, jr.status, u.name, u.email
             FROM crew_join_requests jr
             INNER JOIN users u ON u.id = jr.user_id
             WHERE jr.id = $1 AND jr.crew_id = $2
             LIMIT 1`,
            [requestId, crewId]
        );

        if (!requestRows[0]) {
            return res.status(404).json({ error: 'Join request not found' });
        }

        const request = requestRows[0];
        if (request.status !== 'pending') {
            return res.status(400).json({ error: `Request is already ${request.status}` });
        }

        // Start transaction-like operations
        // 1. Check if user already a member
        const existing = await assertCrewMembership(crewId, request.user_id);
        if (existing) {
            return res.status(400).json({ error: 'User is already a member of this crew' });
        }

        // 2. Add user as crew member
        await db.query(
            `INSERT INTO crew_members (user_id, crew_id, role)
             VALUES ($1, $2, 'member')
             ON CONFLICT DO NOTHING`,
            [request.user_id, crewId]
        );

        // 3. Update request status
        await db.query(
            `UPDATE crew_join_requests
             SET status = 'approved', responded_at = CURRENT_TIMESTAMP, responded_by = $1
             WHERE id = $2`,
            [userId, requestId]
        );

        // 4. Create activity record
        await createCrewActivity({
            crewId,
            actorId: userId,
            actionType: 'join_request_approved',
            entityType: 'member',
            entityId: request.user_id,
            summary: `approved join request from ${request.name || request.email}`,
            meta: { member_email: request.email, member_name: request.name }
        });

        // 5. Notify user
        const crew = await getCrewBase(crewId);
        await createNotification({
            userId: request.user_id,
            type: 'crew_join_approved',
            title: `Joined ${crew?.name}`,
            body: `Your request to join ${crew?.name} was approved!`,
            entityType: 'crew',
            entityId: crewId
        });

        res.status(200).json({ message: 'Join request approved' });
    } catch (error) {
        console.error('Error approving join request:', error);
        res.status(500).json({ error: 'Failed to approve join request' });
    }
};

const rejectJoinRequest = async (req, res) => {
    const { crewId, requestId } = req.params;
    const userId = req.user.id;

    try {
        const membership = await assertCrewMembership(crewId, userId);
        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this crew' });
        }

        // Only admins can reject requests
        if (membership.role !== 'admin') {
            return res.status(403).json({ error: 'Only crew admins can reject join requests' });
        }

        // Get and update the request
        const { rows } = await db.query(
            `UPDATE crew_join_requests
             SET status = 'rejected', responded_at = CURRENT_TIMESTAMP, responded_by = $1
             WHERE id = $2 AND crew_id = $3 AND status = 'pending'
             RETURNING id, user_id`,
            [userId, requestId, crewId]
        );

        if (!rows[0]) {
            return res.status(404).json({ error: 'Join request not found or already processed' });
        }

        // Notify user
        const crew = await getCrewBase(crewId);
        await createNotification({
            userId: rows[0].user_id,
            type: 'crew_join_rejected',
            title: `Request to join ${crew?.name} was declined`,
            body: `Your request to join ${crew?.name} was declined.`,
            entityType: 'crew',
            entityId: crewId
        });

        res.status(200).json({ message: 'Join request rejected' });
    } catch (error) {
        console.error('Error rejecting join request:', error);
        res.status(500).json({ error: 'Failed to reject join request' });
    }
};

module.exports = {
    getMyCrews,
    createCrew,
    joinCrew,
    getCrewDashboard,
    addCrewMember,
    removeCrewMember,
    getJoinRequests,
    approveJoinRequest,
    rejectJoinRequest,
    createTask,
    updateTask,
    deleteTask,
    createEvent,
    deleteEvent,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    getCrewHistory
};
