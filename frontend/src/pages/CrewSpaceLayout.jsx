import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import SectionCard from '../components/SectionCard';
import { useI18n } from '../context/I18nContext';
import { getCrewDashboard } from '../services/crewService';

const TAB_ITEMS = [
    { key: 'overview', labelKey: 'crews_tab_overview', icon: '🪐' },
    { key: 'tasks', labelKey: 'crews_tab_tasks', icon: '📋' },
    { key: 'events', labelKey: 'crews_tab_events', icon: '📅' },
    { key: 'milestones', labelKey: 'crews_tab_milestones', icon: '🏆' },
    { key: 'history', labelKey: 'crews_tab_history', icon: '🕘' }
];

const CrewSpaceLayout = () => {
    const { crewId } = useParams();
    const { t } = useI18n();
    const [dashboard, setDashboard] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const refreshCrew = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await getCrewDashboard(crewId);
            setDashboard(data);
        } catch (loadError) {
            setError(loadError?.response?.data?.error || t('crews_dashboard_error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshCrew();
    }, [crewId]);

    const completionRate = useMemo(() => {
        if (!dashboard?.tasks?.length) {
            return 0;
        }

        const completed = dashboard.tasks.filter((task) => task.status === 'done').length;
        return Math.round((completed / dashboard.tasks.length) * 100);
    }, [dashboard]);

    if (loading) {
        return (
            <div className="page">
                <div className="info-banner">{t('crews_workspace_loading')}</div>
            </div>
        );
    }

    if (error || !dashboard?.crew) {
        return (
            <div className="page">
                <div className="error-banner">{error || t('crews_dashboard_error')}</div>
            </div>
        );
    }

    return (
        <div className="page crew-space">
            <header className="page-header crew-space-hero">
                <div>
                    <div className="brand-mark">{t('crews_active_brand')}</div>
                    <h1>{dashboard.crew.name}</h1>
                    <p className="soft-copy">{dashboard.crew.purpose}</p>
                    <div className="inline-actions" style={{ marginTop: '14px' }}>
                        <Link className="ghost-button" to="/crews">{t('crews_back_to_hub')}</Link>
                    </div>
                </div>
                <div className="mini-stat-grid" style={{ width: 'min(520px, 100%)' }}>
                    <div className="mini-stat">
                        {t('crews_members')}
                        <strong>{dashboard.members.length}</strong>
                    </div>
                    <div className="mini-stat">
                        {t('crews_tasks')}
                        <strong>{dashboard.tasks.length}</strong>
                    </div>
                    <div className="mini-stat">
                        {t('crews_milestones')}
                        <strong>{dashboard.milestones.length}</strong>
                    </div>
                    <div className="mini-stat">
                        {t('crews_progress')}
                        <strong>{completionRate}%</strong>
                    </div>
                </div>
            </header>

            <SectionCard title={t('crews_workspace_title')} subtitle={t('crews_workspace_subtitle')}>
                <div className="crew-tab-strip">
                    {TAB_ITEMS.map((tab) => (
                        <NavLink
                            key={tab.key}
                            to={`/crews/${crewId}/${tab.key}`}
                            className={({ isActive }) => `crew-tab${isActive ? ' active' : ''}`}
                        >
                            <span>{tab.icon}</span>
                            <span>{t(tab.labelKey)}</span>
                        </NavLink>
                    ))}
                </div>
            </SectionCard>

            <Outlet context={{ crewId, dashboard, refreshCrew }} />
        </div>
    );
};

export default CrewSpaceLayout;
