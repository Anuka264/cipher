import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import AvatarFrame from '../components/AvatarFrame';
import SectionCard from '../components/SectionCard';
import { useI18n } from '../context/I18nContext';
import { getCrewHistory } from '../services/crewService';
import { formatCrewActivity, getActivityIcon } from '../utils/crewPresentation';

const CrewHistoryPage = () => {
    const { crewId, dashboard } = useOutletContext();
    const { t, locale } = useI18n();
    const [history, setHistory] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await getCrewHistory(crewId);
                setHistory(response);
            } catch (loadError) {
                setError(loadError?.response?.data?.error || t('crews_history_load_error'));
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, [crewId, t]);

    return (
        <SectionCard title={t('crews_history_title')} subtitle={t('crews_history_subtitle')}>
            {error && <div className="error-banner">{error}</div>}
            {loading ? (
                <div className="info-banner">{t('crews_workspace_loading')}</div>
            ) : history.length ? (
                <div className="crew-history-timeline">
                    {history.map((item) => (
                        <article key={item.id} className="crew-history-item">
                            <div className="crew-history-icon">{getActivityIcon(item.action_type)}</div>
                            <div className="crew-history-main">
                                <div className="split-row">
                                    <div className="profile-strip-main">
                                        <AvatarFrame src={item.actor_photo} name={item.actor_name || item.actor_email} size="small" />
                                        <strong>{item.actor_name || item.actor_email || t('common_someone')}</strong>
                                    </div>
                                    <span className="tag">{new Date(item.created_at).toLocaleString(locale)}</span>
                                </div>
                                <p>{formatCrewActivity(item, t, dashboard.crew.name)}</p>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <p>{t('crews_history_empty')}</p>
                </div>
            )}
        </SectionCard>
    );
};

export default CrewHistoryPage;
