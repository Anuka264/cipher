import React, { useState, useEffect } from 'react';
import { getMyCrews } from '../services/crewService';
import SectionCard from './SectionCard';
import { useI18n } from '../context/I18nContext';

const CrewBoard = () => {
    const { t, locale } = useI18n();
    const [crews, setCrews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCrews = async () => {
            try {
                const data = await getMyCrews();
                setCrews(data);
            } catch (err) {
                setError(t('crews_load_error'));
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCrews();
    }, [t]);

    return (
        <SectionCard
            title={t('crews_board_title')}
            subtitle={t('crews_board_subtitle')}
        >
            {loading && <div className="info-banner">{t('crews_loading')}</div>}
            {error && <div className="error-banner">{error}</div>}
            {crews.length > 0 ? (
                <div className="crew-grid">
                    {crews.map(crew => (
                        <div key={crew.id} className="crew-card">
                            <h3>{crew.name}</h3>
                            <p>{crew.purpose}</p>
                            <p className="soft-copy">
                                {t('common_created')} {new Date(crew.created_at).toLocaleDateString(locale)}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <p>{t('crews_none')}</p>
                </div>
            )}
        </SectionCard>
    );
};

export default CrewBoard;
