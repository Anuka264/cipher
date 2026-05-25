import React, { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import AvatarFrame from '../components/AvatarFrame';
import SectionCard from '../components/SectionCard';
import CrewJoinRequestsPanel from '../components/CrewJoinRequestsPanel';
import CrewMembersPanel from '../components/CrewMembersPanel';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { addCrewMember } from '../services/crewService';
import { formatCrewActivity, localizeCrewRole } from '../utils/crewPresentation';

const CrewOverviewPage = () => {
    const { crewId, dashboard, refreshCrew } = useOutletContext();
    const { t, locale } = useI18n();
    const { session } = useAuth();
    const [inviteForm, setInviteForm] = useState({ email: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const createdAt = useMemo(
        () => new Date(dashboard.crew.created_at).toLocaleString(locale),
        [dashboard.crew.created_at, locale]
    );

    const isAdmin = dashboard.membership?.role === 'admin';

    const handleInvite = async (event) => {
        event.preventDefault();
        setMessage('');
        setError('');

        try {
            await addCrewMember(crewId, inviteForm);
            setInviteForm({ email: '' });
            setMessage(t('crews_invite_sent'));
            await refreshCrew();
        } catch (submitError) {
            setError(submitError?.response?.data?.error || t('crews_member_add_error'));
        }
    };

    return (
        <div className="page-grid crew-work-grid">
            <div className="stack">
                {message && <div className="success-banner">{message}</div>}
                {error && <div className="error-banner">{error}</div>}

                {/* Join Requests Panel (Admin Only) */}
                {isAdmin && (
                    <CrewJoinRequestsPanel
                        crewId={crewId}
                        isAdmin={isAdmin}
                        onRequestResolved={refreshCrew}
                    />
                )}

                <SectionCard title={t('crews_overview_title')} subtitle={t('crews_overview_subtitle')}>
                    <div className="crew-overview-grid">
                        <article className="crew-insight-card tone-1">
                            <span className="crew-insight-icon">🎯</span>
                            <strong>{t('crews_purpose')}</strong>
                            <p>{dashboard.crew.purpose}</p>
                        </article>
                        <article className="crew-insight-card tone-2">
                            <span className="crew-insight-icon">🫶</span>
                            <strong>{t('crews_overview_created_by')}</strong>
                            <p>{dashboard.crew.creator_name || dashboard.crew.creator_email || t('profile_unnamed')}</p>
                        </article>
                        <article className="crew-insight-card tone-3">
                            <span className="crew-insight-icon">🕘</span>
                            <strong>{t('common_created')}</strong>
                            <p>{createdAt}</p>
                        </article>
                    </div>
                </SectionCard>

                <SectionCard title={t('crews_members_title')} subtitle={t('crews_members_subtitle')}>
                    <CrewMembersPanel
                        members={dashboard.members}
                        currentUserId={session?.id}
                        userRole={dashboard.membership?.role}
                        crewId={crewId}
                        onMemberRemoved={refreshCrew}
                    />
                </SectionCard>
            </div>

            <div className="stack">
                <SectionCard title={t('crews_manage_members_title')} subtitle={t('crews_invite_subtitle')}>
                    {isAdmin ? (
                        <form className="form-grid" onSubmit={handleInvite}>
                            <div className="field">
                                <label htmlFor="crew-member-email">{t('crews_member_email')}</label>
                                <input
                                    id="crew-member-email"
                                    type="email"
                                    value={inviteForm.email}
                                    onChange={(event) => setInviteForm({ email: event.target.value })}
                                    placeholder={t('crews_member_email_placeholder')}
                                    required
                                />
                            </div>
                            <div className="info-banner">
                                {t('crews_invite_note')}
                            </div>
                            <button className="primary-button" type="submit">{t('crews_send_invite')}</button>
                        </form>
                    ) : (
                        <div className="info-banner">
                            {t('crews_invite_admin_only')}
                        </div>
                    )}
                </SectionCard>

                <SectionCard title={t('crews_recent_activity_title')} subtitle={t('crews_recent_activity_subtitle')}>
                    {dashboard.recent_activity?.length ? (
                        <div className="crew-mini-timeline">
                            {dashboard.recent_activity.map((activity) => (
                                <div key={activity.id} className="crew-mini-event">
                                    <span className="status-pill">{new Date(activity.created_at).toLocaleDateString(locale)}</span>
                                    <p>{formatCrewActivity(activity, t, dashboard.crew.name)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>{t('crews_history_empty')}</p>
                        </div>
                    )}
                    <div className="inline-actions" style={{ marginTop: '12px' }}>
                        <Link className="ghost-button" to={`/crews/${crewId}/history`}>
                            {t('crews_open_history')}
                        </Link>
                    </div>
                </SectionCard>
            </div>
        </div>
    );
};

export default CrewOverviewPage;
