export const TASK_STATUS_ORDER = ['todo', 'in_progress', 'done'];

export const getTaskStatusLabel = (status, t) => {
    const map = {
        todo: 'crews_todo',
        in_progress: 'crews_in_progress',
        done: 'crews_done'
    };

    return map[status] ? t(map[status]) : status;
};

export const getTaskStatusIcon = (status) => {
    const map = {
        todo: '🌱',
        in_progress: '⚡',
        done: '✅'
    };

    return map[status] || '📌';
};

export const localizeCrewRole = (value, t) => {
    const map = {
        admin: 'role_admin',
        member: 'role_member'
    };

    return map[value] ? t(map[value]) : value;
};

export const formatCrewActivity = (activity, t, crewName) => {
    const actor = activity?.actor_name || activity?.actor_email || t('common_someone');
    const meta = activity?.meta || {};

    switch (activity?.action_type) {
    case 'created':
        return `${actor} ${t('crews_activity_created')} ${meta.crew_name || crewName}`.trim();
    case 'joined':
        return `${actor} ${t('crews_activity_joined')}`.trim();
    case 'member_added':
        return `${actor} ${t('crews_activity_member_added')} ${meta.member_name || meta.member_email || ''}`.trim();
    case 'member_removed':
        return `${actor} ${t('crews_activity_member_removed')} ${meta.member_name || meta.member_email || ''}`.trim();
    case 'task_created':
        return `${actor} ${t('crews_activity_task_created')} ${meta.title || ''}`.trim();
    case 'task_updated':
        return `${actor} ${t('crews_activity_task_updated')} ${meta.title || ''}`.trim();
    case 'task_deleted':
        return `${actor} ${t('crews_activity_task_deleted')} ${meta.title || ''}`.trim();
    case 'event_created':
        return `${actor} ${t('crews_activity_event_created')} ${meta.title || ''}`.trim();
    case 'event_deleted':
        return `${actor} ${t('crews_activity_event_deleted')} ${meta.title || ''}`.trim();
    case 'milestone_created':
        return `${actor} ${t('crews_activity_milestone_created')} ${meta.title || ''}`.trim();
    case 'milestone_updated':
        return `${actor} ${t('crews_activity_milestone_updated')} ${meta.title || ''}`.trim();
    case 'milestone_deleted':
        return `${actor} ${t('crews_activity_milestone_deleted')} ${meta.title || ''}`.trim();
    default:
        return activity?.summary || '';
    }
};

export const getActivityIcon = (activityType) => {
    const map = {
        created: '🚀',
        joined: '🤝',
        member_added: '✨',
        member_removed: '🧹',
        task_created: '📋',
        task_updated: '🛠️',
        task_deleted: '🗑️',
        event_created: '📅',
        event_deleted: '🗓️',
        milestone_created: '🏆',
        milestone_updated: '🌟',
        milestone_deleted: '🧩'
    };

    return map[activityType] || '🪄';
};

export const MILESTONE_THEMES = [
    { icon: '🌈', accentClass: 'tone-1' },
    { icon: '🚀', accentClass: 'tone-2' },
    { icon: '🎯', accentClass: 'tone-3' },
    { icon: '🏆', accentClass: 'tone-4' },
    { icon: '🪄', accentClass: 'tone-1' },
    { icon: '🎉', accentClass: 'tone-2' }
];
