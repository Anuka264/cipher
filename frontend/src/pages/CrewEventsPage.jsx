import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import SectionCard from '../components/SectionCard';
import { useI18n } from '../context/I18nContext';
import { createEvent, deleteEvent } from '../services/crewService';

const CrewEventsPage = () => {
    const { crewId, dashboard, refreshCrew } = useOutletContext();
    const { t, locale } = useI18n();
    const [form, setForm] = useState({ title: '', location: '', event_date: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleCreate = async (event) => {
        event.preventDefault();
        setMessage('');
        setError('');

        try {
            await createEvent(crewId, form);
            setForm({ title: '', location: '', event_date: '' });
            setMessage(t('crews_event_added'));
            await refreshCrew();
        } catch (submitError) {
            setError(submitError?.response?.data?.error || t('crews_event_error'));
        }
    };

    const handleDelete = async (eventId) => {
        setMessage('');
        setError('');

        try {
            await deleteEvent(crewId, eventId);
            setMessage(t('crews_event_deleted'));
            await refreshCrew();
        } catch (submitError) {
            setError(submitError?.response?.data?.error || t('crews_event_error'));
        }
    };

    const formatDateTime = (value) => {
        if (!value) {
            return t('crews_no_date');
        }

        return new Date(value).toLocaleString(locale);
    };

    return (
        <div className="page crew-subpage">
            {message && <div className="success-banner">{message}</div>}
            {error && <div className="error-banner">{error}</div>}

            <SectionCard title={t('crews_events_page_title')} subtitle={t('crews_events_page_subtitle')}>
                <form className="form-grid" onSubmit={handleCreate}>
                    <div className="profile-grid">
                        <div className="field">
                            <label htmlFor="crew-event-title">{t('crews_event_title')}</label>
                            <input
                                id="crew-event-title"
                                value={form.title}
                                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                                placeholder={t('crews_event_placeholder')}
                                required
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="crew-event-location">{t('crews_location')}</label>
                            <input
                                id="crew-event-location"
                                value={form.location}
                                onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                                placeholder={t('crews_location_placeholder')}
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="crew-event-date">{t('crews_event_date')}</label>
                            <input
                                id="crew-event-date"
                                type="datetime-local"
                                value={form.event_date}
                                onChange={(event) => setForm((current) => ({ ...current, event_date: event.target.value }))}
                                required
                            />
                        </div>
                    </div>

                    <div className="inline-actions">
                        <button className="primary-button" type="submit">{t('crews_schedule_event')}</button>
                    </div>
                </form>
            </SectionCard>

            <div className="crew-event-grid">
                {dashboard.events?.length ? dashboard.events.map((eventItem, index) => (
                    <article key={eventItem.id} className={`crew-event-card tone-${(index % 4) + 1}`}>
                        <div className="split-row">
                            <span className="crew-card-badge">📅 {formatDateTime(eventItem.event_date)}</span>
                            <button
                                type="button"
                                className="danger-button"
                                onClick={() => handleDelete(eventItem.id)}
                            >
                                {t('crews_delete_event')}
                            </button>
                        </div>
                        <strong>{eventItem.title}</strong>
                        <p className="soft-copy">{eventItem.location || t('crews_no_location')}</p>
                    </article>
                )) : (
                    <SectionCard title={t('crews_events_title')} subtitle={t('crews_events_subtitle')}>
                        <div className="empty-state">
                            <p>{t('crews_no_events')}</p>
                        </div>
                    </SectionCard>
                )}
            </div>
        </div>
    );
};

export default CrewEventsPage;
