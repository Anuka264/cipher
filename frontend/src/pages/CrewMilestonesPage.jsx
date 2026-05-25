import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import SectionCard from '../components/SectionCard';
import { useI18n } from '../context/I18nContext';
import { createMilestone, deleteMilestone, updateMilestone } from '../services/crewService';
import { MILESTONE_THEMES } from '../utils/crewPresentation';

const CrewMilestonesPage = () => {
    const { crewId, dashboard, refreshCrew } = useOutletContext();
    const { t } = useI18n();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const milestoneStats = useMemo(() => {
        const total = dashboard.milestones.length;
        const achieved = dashboard.milestones.filter((milestone) => milestone.is_achieved).length;

        return {
            total,
            achieved,
            open: total - achieved
        };
    }, [dashboard.milestones]);

    const handleCreate = async (event) => {
        event.preventDefault();
        setMessage('');
        setError('');

        try {
            await createMilestone(crewId, { title });
            setTitle('');
            setMessage(t('crews_milestone_added'));
            await refreshCrew();
        } catch (submitError) {
            setError(submitError?.response?.data?.error || t('crews_milestone_error'));
        }
    };

    const handleToggle = async (milestone) => {
        setMessage('');
        setError('');

        try {
            await updateMilestone(crewId, milestone.id, { is_achieved: !milestone.is_achieved });
            setMessage(t('crews_milestone_updated'));
            await refreshCrew();
        } catch (submitError) {
            setError(submitError?.response?.data?.error || t('crews_milestone_update_error'));
        }
    };

    const handleDelete = async (milestoneId) => {
        setMessage('');
        setError('');

        try {
            await deleteMilestone(crewId, milestoneId);
            setMessage(t('crews_milestone_deleted'));
            await refreshCrew();
        } catch (submitError) {
            setError(submitError?.response?.data?.error || t('crews_milestone_update_error'));
        }
    };

    return (
        <div className="page crew-subpage">
            {message && <div className="success-banner">{message}</div>}
            {error && <div className="error-banner">{error}</div>}

            <header className="page-header crew-milestone-hero">
                <div>
                    <div className="brand-mark">{t('crews_milestones')}</div>
                    <h1>{t('crews_milestones_page_title')}</h1>
                    <p className="soft-copy">{t('crews_milestones_page_subtitle')}</p>
                </div>
                <div className="mini-stat-grid" style={{ width: 'min(420px, 100%)' }}>
                    <div className="mini-stat">
                        {t('crews_milestones')}
                        <strong>{milestoneStats.total}</strong>
                    </div>
                    <div className="mini-stat">
                        {t('crews_achieved')}
                        <strong>{milestoneStats.achieved}</strong>
                    </div>
                    <div className="mini-stat">
                        {t('crews_open')}
                        <strong>{milestoneStats.open}</strong>
                    </div>
                </div>
            </header>

            <SectionCard title={t('crews_milestones_title')} subtitle={t('crews_milestones_subtitle')}>
                <form className="form-grid" onSubmit={handleCreate}>
                    <div className="field">
                        <label htmlFor="crew-milestone-title">{t('crews_milestone_title')}</label>
                        <input
                            id="crew-milestone-title"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder={t('crews_milestone_placeholder')}
                            required
                        />
                    </div>
                    <div className="inline-actions">
                        <button className="primary-button" type="submit">{t('crews_add_milestone')}</button>
                    </div>
                </form>
            </SectionCard>

            {dashboard.milestones?.length ? (
                <div className="milestone-journey">
                    {dashboard.milestones.map((milestone, index) => {
                        const theme = MILESTONE_THEMES[index % MILESTONE_THEMES.length];
                        return (
                            <article
                                key={milestone.id}
                                className={`milestone-card ${theme.accentClass}${milestone.is_achieved ? ' achieved' : ''}`}
                            >
                                <div className="milestone-path-line" />
                                <div className="milestone-medal">
                                    <span>{milestone.is_achieved ? '⭐' : theme.icon}</span>
                                </div>
                                <div className="milestone-copy">
                                    <span className="crew-card-badge">
                                        {milestone.is_achieved ? t('crews_achieved') : t('crews_open')}
                                    </span>
                                    <strong>{milestone.title}</strong>
                                    <p className="soft-copy">
                                        {milestone.is_achieved
                                            ? t('crews_mark_open')
                                            : t('crews_mark_achieved')}
                                    </p>
                                </div>
                                <div className="inline-actions milestone-actions">
                                    <button
                                        type="button"
                                        className={milestone.is_achieved ? 'ghost-button' : 'primary-button'}
                                        onClick={() => handleToggle(milestone)}
                                    >
                                        {milestone.is_achieved ? t('crews_mark_open') : t('crews_mark_achieved')}
                                    </button>
                                    <button
                                        type="button"
                                        className="danger-button"
                                        onClick={() => handleDelete(milestone.id)}
                                    >
                                        {t('crews_delete_milestone')}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <p>{t('crews_no_milestones')}</p>
                </div>
            )}
        </div>
    );
};

export default CrewMilestonesPage;
