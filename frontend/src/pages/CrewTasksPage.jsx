import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import SectionCard from '../components/SectionCard';
import { useI18n } from '../context/I18nContext';
import { createTask, deleteTask, updateTask } from '../services/crewService';
import { getTaskStatusIcon, getTaskStatusLabel, TASK_STATUS_ORDER } from '../utils/crewPresentation';

const CrewTasksPage = () => {
    const { crewId, dashboard, refreshCrew } = useOutletContext();
    const { t, locale } = useI18n();
    const [form, setForm] = useState({ title: '', assigned_to: '', due_date: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const groupedTasks = useMemo(() => {
        const seed = {
            todo: [],
            in_progress: [],
            done: []
        };

        (dashboard.tasks || []).forEach((task) => {
            if (seed[task.status]) {
                seed[task.status].push(task);
            }
        });

        return seed;
    }, [dashboard.tasks]);

    const handleCreate = async (event) => {
        event.preventDefault();
        setMessage('');
        setError('');

        try {
            await createTask(crewId, {
                title: form.title,
                assigned_to: form.assigned_to || null,
                due_date: form.due_date || null
            });
            setForm({ title: '', assigned_to: '', due_date: '' });
            setMessage(t('crews_task_added'));
            await refreshCrew();
        } catch (submitError) {
            setError(submitError?.response?.data?.error || t('crews_task_error'));
        }
    };

    const handleMove = async (taskId, nextStatus) => {
        setMessage('');
        setError('');

        try {
            await updateTask(crewId, taskId, { status: nextStatus });
            setMessage(t('crews_task_status_updated'));
            await refreshCrew();
        } catch (submitError) {
            setError(submitError?.response?.data?.error || t('crews_task_status_error'));
        }
    };

    const handleDelete = async (taskId) => {
        setMessage('');
        setError('');

        try {
            await deleteTask(crewId, taskId);
            setMessage(t('crews_task_deleted'));
            await refreshCrew();
        } catch (submitError) {
            setError(submitError?.response?.data?.error || t('crews_task_status_error'));
        }
    };

    const formatDueDate = (value) => {
        if (!value) {
            return t('crews_no_date');
        }

        return new Date(value).toLocaleDateString(locale);
    };

    return (
        <div className="page crew-subpage">
            {message && <div className="success-banner">{message}</div>}
            {error && <div className="error-banner">{error}</div>}

            <SectionCard title={t('crews_tasks_page_title')} subtitle={t('crews_tasks_page_subtitle')}>
                <form className="form-grid" onSubmit={handleCreate}>
                    <div className="profile-grid">
                        <div className="field">
                            <label htmlFor="crew-task-title">{t('crews_task_title')}</label>
                            <input
                                id="crew-task-title"
                                value={form.title}
                                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                                placeholder={t('crews_task_placeholder')}
                                required
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="crew-task-assignee">{t('crews_assign_to_member')}</label>
                            <select
                                id="crew-task-assignee"
                                value={form.assigned_to}
                                onChange={(event) => setForm((current) => ({ ...current, assigned_to: event.target.value }))}
                            >
                                <option value="">{t('crews_no_assignee')}</option>
                                {dashboard.members.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name || member.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="crew-task-due-date">{t('crews_due_date')}</label>
                            <input
                                id="crew-task-due-date"
                                type="date"
                                value={form.due_date}
                                onChange={(event) => setForm((current) => ({ ...current, due_date: event.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="inline-actions">
                        <button className="primary-button" type="submit">{t('crews_add_task')}</button>
                    </div>
                </form>
            </SectionCard>

            <div className="crew-task-columns">
                {TASK_STATUS_ORDER.map((status, columnIndex) => (
                    <SectionCard
                        key={status}
                        title={getTaskStatusLabel(status, t)}
                        subtitle={`${groupedTasks[status].length} ${t('crews_tasks_count')}`}
                    >
                        <div className="crew-task-stack">
                            {groupedTasks[status].length ? groupedTasks[status].map((task, taskIndex) => {
                                const currentIndex = TASK_STATUS_ORDER.indexOf(task.status);
                                return (
                                    <article key={task.id} className={`crew-task-card tone-${((columnIndex + taskIndex) % 4) + 1}`}>
                                        <div className="split-row">
                                            <span className="crew-card-badge">
                                                {getTaskStatusIcon(task.status)} {getTaskStatusLabel(task.status, t)}
                                            </span>
                                            <button
                                                type="button"
                                                className="danger-button"
                                                onClick={() => handleDelete(task.id)}
                                            >
                                                {t('crews_delete_task')}
                                            </button>
                                        </div>
                                        <strong>{task.title}</strong>
                                        <div className="soft-copy">
                                            {t('crews_assigned_to')}: {task.assigned_to_name || t('crews_no_assignee')}
                                        </div>
                                        <div className="soft-copy">
                                            {t('crews_due')}: {formatDueDate(task.due_date)}
                                        </div>
                                        <div className="inline-actions" style={{ marginTop: '12px' }}>
                                            {currentIndex > 0 && (
                                                <button
                                                    type="button"
                                                    className="ghost-button"
                                                    onClick={() => handleMove(task.id, TASK_STATUS_ORDER[currentIndex - 1])}
                                                >
                                                    {t('crews_move_back')}
                                                </button>
                                            )}
                                            {currentIndex < TASK_STATUS_ORDER.length - 1 && (
                                                <button
                                                    type="button"
                                                    className="primary-button"
                                                    onClick={() => handleMove(task.id, TASK_STATUS_ORDER[currentIndex + 1])}
                                                >
                                                    {t('crews_move_forward')}
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                );
                            }) : (
                                <div className="empty-state">
                                    <p>{t('crews_no_tasks')}</p>
                                </div>
                            )}
                        </div>
                    </SectionCard>
                ))}
            </div>
        </div>
    );
};

export default CrewTasksPage;
