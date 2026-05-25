import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionCard from '../components/SectionCard';
import { useI18n } from '../context/I18nContext';
import { createCrew, getMyCrews } from '../services/crewService';
import { localizeCrewRole } from '../utils/crewPresentation';

const CrewsPage = () => {
    const { t } = useI18n();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', purpose: '' });
    const [crews, setCrews] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const loadCrews = async () => {
        try {
            const data = await getMyCrews();
            setCrews(data);
        } catch (loadError) {
            setError(t('crews_load_error'));
        }
    };

    useEffect(() => {
        loadCrews();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const handleCreateCrew = async (event) => {
        event.preventDefault();
        setMessage('');
        setError('');

        try {
            const created = await createCrew(form);
            setForm({ name: '', purpose: '' });
            setMessage(t('crews_created'));
            await loadCrews();
            navigate(`/crews/${created.id}/overview`);
        } catch (submitError) {
            setError(submitError?.response?.data?.error || t('crews_create_error'));
        }
    };

    return (
        <div className="page">
            <header className="page-header crew-hub-hero">
                <div>
                    <div className="brand-mark">{t('crews_brand')}</div>
                    <h1>{t('crews_title')}</h1>
                    <p className="soft-copy">{t('crews_subtitle')}</p>
                </div>
                <div className="mini-stat-grid" style={{ width: 'min(420px, 100%)' }}>
                    <div className="mini-stat">
                        {t('crews_board_title')}
                        <strong>{crews.length}</strong>
                    </div>
                    <div className="mini-stat">
                        {t('crews_members_count')}
                        <strong>{crews.reduce((sum, crew) => sum + (crew.member_count || 0), 0)}</strong>
                    </div>
                </div>
            </header>

            {message && <div className="success-banner">{message}</div>}
            {error && <div className="error-banner">{error}</div>}

            <div className="page-grid crew-hub-grid">
                <SectionCard title={t('crews_create_title')} subtitle={t('crews_create_subtitle')}>
                    <form className="form-grid" onSubmit={handleCreateCrew}>
                        <div className="field">
                            <label htmlFor="crew-name">{t('crews_name')}</label>
                            <input
                                id="crew-name"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder={t('crews_name_placeholder')}
                                required
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="crew-purpose">{t('crews_purpose')}</label>
                            <textarea
                                id="crew-purpose"
                                name="purpose"
                                value={form.purpose}
                                onChange={handleChange}
                                placeholder={t('crews_purpose_placeholder')}
                                required
                            />
                        </div>

                        <button className="primary-button" type="submit">
                            {t('crews_create')}
                        </button>
                    </form>
                </SectionCard>

                <SectionCard title={t('crews_board_title')} subtitle={t('crews_board_subtitle')}>
                    {crews.length > 0 ? (
                        <div className="crew-hub-list">
                            {crews.map((crew, index) => (
                                <button
                                    key={crew.id}
                                    type="button"
                                    className={`crew-hub-card tone-${(index % 4) + 1}`}
                                    onClick={() => navigate(`/crews/${crew.id}/overview`)}
                                >
                                    <div className="split-row">
                                        <strong>{crew.name}</strong>
                                        <span className="tag">{localizeCrewRole(crew.role, t)}</span>
                                    </div>
                                    <div className="soft-copy">{crew.purpose}</div>
                                    <div className="tag-row">
                                        <span className="tag">{crew.member_count || 0} {t('crews_members_count')}</span>
                                        <span className="tag">{crew.task_count || 0} {t('crews_tasks_count')}</span>
                                        <span className="tag">{crew.completed_task_count || 0} {t('crews_done_count')}</span>
                                    </div>
                                    <div className="inline-actions" style={{ marginTop: '10px' }}>
                                        <span className="status-pill">{t('crews_open_dashboard')}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>{t('crews_first_unlock')}</p>
                        </div>
                    )}
                </SectionCard>
            </div>
        </div>
    );
};

export default CrewsPage;
