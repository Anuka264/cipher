import React, { useState, useEffect } from 'react';
import { getJoinRequests, approveJoinRequest, rejectJoinRequest } from '../services/crewService';
import AvatarFrame from './AvatarFrame';
import SectionCard from './SectionCard';
import { useI18n } from '../context/I18nContext';

const CrewJoinRequestsPanel = ({ crewId, isAdmin, onRequestResolved }) => {
    const { t, locale } = useI18n();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [processingId, setProcessingId] = useState('');

    useEffect(() => {
        if (isAdmin && crewId) {
            loadRequests();
        }
    }, [crewId, isAdmin]);

    const loadRequests = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getJoinRequests(crewId);
            setRequests(data || []);
        } catch (err) {
            setError(err?.response?.data?.error || t('crew_requests_load_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId, userName) => {
        setProcessingId(requestId);
        setError('');
        try {
            await approveJoinRequest(crewId, requestId);
            setRequests(prev => prev.filter(r => r.id !== requestId));
            if (onRequestResolved) onRequestResolved();
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to approve request');
        } finally {
            setProcessingId('');
        }
    };

    const handleReject = async (requestId) => {
        setProcessingId(requestId);
        setError('');
        try {
            await rejectJoinRequest(crewId, requestId);
            setRequests(prev => prev.filter(r => r.id !== requestId));
            if (onRequestResolved) onRequestResolved();
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to reject request');
        } finally {
            setProcessingId('');
        }
    };

    if (!isAdmin) {
        return null;
    }

    if (loading) {
        return (
            <SectionCard title={t('crew_join_requests')} subtitle={t('crew_requests_subtitle')}>
                <div className="info-banner">{t('common_loading')}</div>
            </SectionCard>
        );
    }

    if (requests.length === 0) {
        return null;
    }

    return (
        <SectionCard
            title={t('crew_join_requests')}
            subtitle={`${requests.length} pending request${requests.length !== 1 ? 's' : ''}`}
        >
            {error && <div className="error-banner">{error}</div>}

            <div className="request-list">
                {requests.map((request) => (
                    <div key={request.id} className="request-card">
                        <div className="split-row">
                            <div className="profile-strip-main">
                                <AvatarFrame
                                    src={request.profile_photo_url}
                                    name={request.name || request.email}
                                    size="small"
                                />
                                <div>
                                    <strong>{request.name || request.email}</strong>
                                    <div className="soft-copy" style={{ marginTop: '4px' }}>
                                        {request.email}
                                    </div>
                                </div>
                            </div>
                            {request.intensity_level && (
                                <span className={`intensity-badge ${(request.intensity_level || 'dedicated').toLowerCase()}`}>
                                    {request.intensity_level}
                                </span>
                            )}
                        </div>

                        <div className="soft-copy" style={{ marginTop: '10px', fontSize: '0.85rem' }}>
                            {t('crew_requested')}: {new Date(request.created_at).toLocaleDateString(locale)}
                        </div>

                        <div className="inline-actions" style={{ marginTop: '12px', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                                type="button"
                                className="ghost-button"
                                onClick={() => handleReject(request.id)}
                                disabled={processingId === request.id}
                            >
                                {processingId === request.id ? '...' : t('crew_decline')}
                            </button>
                            <button
                                type="button"
                                className="primary-button"
                                onClick={() => handleApprove(request.id, request.name || request.email)}
                                disabled={processingId === request.id}
                            >
                                {processingId === request.id ? '...' : t('crew_approve')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </SectionCard>
    );
};

export default CrewJoinRequestsPanel;
