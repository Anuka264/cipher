import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionCard from '../components/SectionCard';
import AvatarFrame from '../components/AvatarFrame';
import { useI18n } from '../context/I18nContext';
import {
    getConnections,
    getPendingRequests,
    respondToConnectionRequest
} from '../services/connectionService';

const ConnectionsPage = () => {
    const { t } = useI18n();
    const navigate = useNavigate();
    const [connections, setConnections] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [error, setError] = useState('');

    const loadData = async () => {
        try {
            const [connectionsData, pendingData] = await Promise.all([
                getConnections(),
                getPendingRequests()
            ]);
            setConnections(connectionsData);
            setPendingRequests(pendingData);
        } catch (loadError) {
            setError(t('connections_load_error'));
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRespond = async (connectionId, action) => {
        try {
            await respondToConnectionRequest(connectionId, action);
            await loadData();
        } catch (responseError) {
            setError(t('connections_update_error'));
        }
    };

    const localizeIntensity = (value) => {
        const map = {
            Casual: 'common_casual',
            Dedicated: 'common_dedicated',
            Vanguard: 'common_vanguard'
        };

        return map[value] ? t(map[value]) : value;
    };

    return (
        <div className="page">
            <header className="page-header">
                <div>
                    <div className="brand-mark">{t('connections_brand')}</div>
                    <h1>{t('connections_title')}</h1>
                    <p className="soft-copy">{t('connections_subtitle')}</p>
                </div>
            </header>

            {error && <div className="error-banner">{error}</div>}

            <div className="page-grid">
                <SectionCard title={t('connections_accepted_title')} subtitle={t('connections_accepted_subtitle')}>
                    {connections.length > 0 ? (
                        <div className="connection-grid">
                            {connections.map((connection) => (
                                <div key={connection.connection_id} className="connection-card">
                                    <div className="split-row">
                                        <div className="profile-strip-main">
                                            <AvatarFrame src={connection.profile_photo_url} name={connection.name || connection.email} size="small" />
                                            <div>
                                                <strong>{connection.name || connection.email}</strong>
                                                <div className="soft-copy">{connection.email}</div>
                                            </div>
                                        </div>
                                        <span className={`intensity-badge ${(connection.intensity_level || 'dedicated').toLowerCase()}`}>
                                            {localizeIntensity(connection.intensity_level)}
                                        </span>
                                    </div>
                                    <div className="inline-actions" style={{ marginTop: '14px' }}>
                                        <button
                                            className="primary-button"
                                            onClick={() => navigate('/messages', { state: { selectedUserId: connection.user_id } })}
                                        >
                                            {t('connections_open_chat')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>{t('connections_none')}</p>
                        </div>
                    )}
                </SectionCard>

                <SectionCard title={t('connections_pending_title')} subtitle={t('connections_pending_subtitle')}>
                    {pendingRequests.length > 0 ? (
                        <div className="request-list">
                            {pendingRequests.map((request) => (
                                <div key={request.id} className="request-card">
                                    <div className="profile-strip-main">
                                        <AvatarFrame src={request.profile_photo_url} name={request.name || request.email} size="small" />
                                        <div>
                                            <strong>{request.name || request.email}</strong>
                                            <div className="soft-copy">{request.email}</div>
                                        </div>
                                    </div>
                                    <div className="inline-actions" style={{ marginTop: '14px' }}>
                                        <button className="primary-button" onClick={() => handleRespond(request.id, 'accepted')}>
                                            {t('common_accept')}
                                        </button>
                                        <button className="ghost-button" onClick={() => handleRespond(request.id, 'declined')}>
                                            {t('common_decline')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>{t('connections_pending_none')}</p>
                        </div>
                    )}
                </SectionCard>
            </div>
        </div>
    );
};

export default ConnectionsPage;
