import React, { useEffect, useMemo, useState } from 'react';
import SectionCard from '../components/SectionCard';
import { useI18n } from '../context/I18nContext';
import {
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead
} from '../services/userService';

const formatRelativeTime = (value, locale) => {
    if (!value) {
        return null;
    }

    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
        Math.round((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60)),
        'hour'
    );
};

const NotificationsPage = () => {
    const { t, locale } = useI18n();
    const [notifications, setNotifications] = useState([]);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    const loadNotifications = async () => {
        try {
            const data = await getNotifications();
            setNotifications(data);
        } catch (loadError) {
            setError(t('notifications_load_error'));
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const unreadCount = useMemo(
        () => notifications.filter((item) => !item.is_read).length,
        [notifications]
    );

    const handleRead = async (notificationId) => {
        try {
            await markNotificationRead(notificationId);
            setNotifications((current) =>
                current.map((item) => (
                    item.id === notificationId
                        ? { ...item, is_read: true }
                        : item
                ))
            );
        } catch (updateError) {
            setError(t('notifications_update_error'));
        }
    };

    const handleReadAll = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
            setStatus(t('notifications_marked_all'));
        } catch (updateError) {
            setError(t('notifications_mark_error'));
        }
    };

    const getNotificationTitle = (notification) => {
        const key = `notification_type_${notification.type}`;
        const localized = t(key);
        return localized === key ? notification.title : localized;
    };

    return (
        <div className="page">
            <header className="page-header">
                <div>
                    <div className="brand-mark">{t('notifications_brand')}</div>
                    <h1>{t('notifications_title')}</h1>
                    <p className="soft-copy">{t('notifications_subtitle')}</p>
                </div>
                <div className="mini-stat-grid" style={{ width: 'min(300px, 100%)' }}>
                    <div className="mini-stat">
                        {t('notifications_unread')}
                        <strong>{unreadCount}</strong>
                    </div>
                </div>
            </header>

            {status && <div className="success-banner">{status}</div>}
            {error && <div className="error-banner">{error}</div>}

            <SectionCard title={t('notifications_recent_title')} subtitle={t('notifications_recent_subtitle')}>
                <div className="split-row" style={{ marginBottom: '12px' }}>
                    <span className="soft-copy">{notifications.length} {t('notifications_items_loaded')}</span>
                    <button className="ghost-button" type="button" onClick={handleReadAll}>
                        {t('notifications_mark_all')}
                    </button>
                </div>

                {notifications.length > 0 ? (
                    <div className="request-list">
                        {notifications.map((notification) => (
                            <article
                                key={notification.id}
                                className={`notification-card${notification.is_read ? '' : ' unread'}`}
                            >
                                <div className="split-row">
                                    <div>
                                        <strong>{getNotificationTitle(notification)}</strong>
                                        <div className="soft-copy">{notification.body || t('notifications_default_body')}</div>
                                    </div>
                                    <span className="tag">{formatRelativeTime(notification.created_at, locale) || t('notifications_just_now')}</span>
                                </div>
                                <div className="inline-actions" style={{ marginTop: '12px' }}>
                                    <span className="tag">{getNotificationTitle(notification)}</span>
                                    {!notification.is_read && (
                                        <button
                                            className="primary-button"
                                            type="button"
                                            onClick={() => handleRead(notification.id)}
                                        >
                                            {t('notifications_mark_read')}
                                        </button>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>{t('notifications_empty')}</p>
                    </div>
                )}
            </SectionCard>
        </div>
    );
};

export default NotificationsPage;
