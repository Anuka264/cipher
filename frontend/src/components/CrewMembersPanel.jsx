import React, { useState } from 'react';
import { removeCrewMember } from '../services/crewService';
import AvatarFrame from './AvatarFrame';
import { useI18n } from '../context/I18nContext';

const CrewMembersPanel = ({ members, currentUserId, userRole, crewId, onMemberRemoved }) => {
    const { t } = useI18n();
    const [removingMemberId, setRemovingMemberId] = useState('');
    const [error, setError] = useState('');

    const isCurrentUserAdmin = userRole === 'admin';

    const handleRemoveMember = async (memberId, memberName) => {
        if (!window.confirm(`${t('crew_remove_confirm')} ${memberName}?`)) {
            return;
        }

        setRemovingMemberId(memberId);
        setError('');
        try {
            await removeCrewMember(crewId, memberId);
            if (onMemberRemoved) onMemberRemoved();
        } catch (err) {
            setError(err?.response?.data?.error || t('crew_remove_error'));
            setRemovingMemberId('');
        }
    };

    const handleLeaveCrew = async () => {
        if (!window.confirm(t('crew_leave_confirm'))) {
            return;
        }

        setRemovingMemberId(currentUserId);
        setError('');
        try {
            await removeCrewMember(crewId, currentUserId);
            if (onMemberRemoved) onMemberRemoved();
        } catch (err) {
            setError(err?.response?.data?.error || t('crew_leave_error'));
            setRemovingMemberId('');
        }
    };

    return (
        <div>
            {error && <div className="error-banner">{error}</div>}

            <div className="crew-member-grid">
                {members.map((member) => {
                    const isCurrentUser = member.id === currentUserId;
                    const canRemove = isCurrentUserAdmin || isCurrentUser;

                    return (
                        <div key={member.id} className="crew-member-card">
                            <div className="profile-strip-main">
                                <AvatarFrame
                                    src={member.profile_photo_url}
                                    name={member.name || member.email}
                                    size="small"
                                />
                                <div>
                                    <strong>{member.name || member.email}</strong>
                                    <div className="soft-copy" style={{ marginTop: '4px', fontSize: '0.85rem' }}>
                                        {member.role === 'admin' && (
                                            <span className="status-pill">{t('crew_admin')}</span>
                                        )}
                                        {isCurrentUser && (
                                            <span
                                                className="status-pill"
                                                style={{
                                                    background: 'rgba(143, 240, 210, 0.2)',
                                                    color: '#adf4dd',
                                                    marginLeft: '6px'
                                                }}
                                            >
                                                {t('crew_you')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="soft-copy" style={{ marginTop: '8px', fontSize: '0.82rem' }}>
                                {t('crew_joined')}: {new Date(member.joined_at).toLocaleDateString()}
                            </div>

                            {canRemove && (
                                <div className="inline-actions" style={{ marginTop: '10px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        className="danger-button"
                                        onClick={() => {
                                            if (isCurrentUser) {
                                                handleLeaveCrew();
                                            } else {
                                                handleRemoveMember(member.id, member.name || member.email);
                                            }
                                        }}
                                        disabled={removingMemberId === member.id}
                                    >
                                        {removingMemberId === member.id
                                            ? '...'
                                            : isCurrentUser
                                            ? t('crew_leave')
                                            : t('crew_remove')}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CrewMembersPanel;
