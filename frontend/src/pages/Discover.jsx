import React, { useEffect, useState } from 'react';
import OracleChat from '../components/OracleChat';
import MatchCard from '../components/MatchCard';
import SectionCard from '../components/SectionCard';
import {
    ACADEMIC_YEAR_OPTIONS,
    COURSE_OPTIONS,
    FACULTY_OPTIONS
} from '../constants/profileOptions';
import { useI18n } from '../context/I18nContext';
import {
    getPendingRequests,
    respondToConnectionRequest,
    sendConnectionRequest
} from '../services/connectionService';
import { getMatches } from '../services/userService';

const defaultFilters = {
    search: '',
    intensity: '',
    faculty: '',
    course: '',
    academic_year: '',
    goal: '',
    skill: '',
    interest: ''
};

const Discover = () => {
    const { t } = useI18n();
    const [matches, setMatches] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [filters, setFilters] = useState(defaultFilters);

    const loadData = async (activeFilters = filters) => {
        try {
            const [matchData, requestData] = await Promise.all([
                getMatches(activeFilters).catch((matchError) => {
                    if (matchError?.response?.data?.error === 'User not onboarded') {
                        return [];
                    }
                    throw matchError;
                }),
                getPendingRequests()
            ]);
            setMatches(matchData);
            setPendingRequests(requestData);
        } catch (err) {
            setError(t('discover_load_error'));
        }
    };

    useEffect(() => {
        loadData(defaultFilters);
    }, []);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters((current) => ({ ...current, [name]: value }));
    };

    const handleFilterSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setStatus('');
        await loadData(filters);
    };

    const handleFilterReset = async () => {
        setFilters(defaultFilters);
        await loadData(defaultFilters);
    };

    const handleConnectRequest = async (id) => {
        try {
            await sendConnectionRequest(id);
            setMatches((currentMatches) =>
                currentMatches.map((match) =>
                    match.id === id
                        ? { ...match, connection_status: 'pending', has_incoming_request: false }
                        : match
                )
            );
            setStatus(t('discover_connection_sent'));
            setError('');
        } catch (err) {
            setError(err?.response?.data?.error || t('discover_connect_error'));
        }
    };

    const handleRequestResponse = async (connectionId, action) => {
        try {
            const response = await respondToConnectionRequest(connectionId, action);
            setPendingRequests((currentRequests) =>
                currentRequests.filter((request) => request.id !== connectionId)
            );

            if (action === 'accepted') {
                setMatches((currentMatches) =>
                    currentMatches.map((match) =>
                        match.id === response.connection.requester_id
                            ? { ...match, connection_status: 'accepted', has_incoming_request: false }
                            : match
                    )
                );
            }

            setStatus(action === 'accepted' ? t('discover_request_accepted') : t('discover_request_declined'));
            setError('');
        } catch (err) {
            setError(t('discover_request_update_error'));
        }
    };

    const localizeIntensity = (value) => {
        const map = {
            Casual: 'common_casual',
            Dedicated: 'common_dedicated',
            Vanguard: 'common_vanguard'
        };

        return map[value] ? t(map[value]) : value;
    };

    return (
        <div className="page">
            <header className="page-header">
                <div>
                    <div className="brand-mark">{t('discover_brand')}</div>
                    <h1>{t('discover_title')}</h1>
                    <p className="soft-copy">{t('discover_subtitle')}</p>
                </div>
                <div className="mini-stat-grid" style={{ width: 'min(420px, 100%)' }}>
                    <div className="mini-stat">
                        {t('discover_pending_requests')}
                        <strong>{pendingRequests.length}</strong>
                    </div>
                    <div className="mini-stat">
                        {t('discover_loaded_matches')}
                        <strong>{matches.length}</strong>
                    </div>
                </div>
            </header>

            {status && <div className="success-banner">{status}</div>}
            {error && <div className="error-banner">{error}</div>}

            <div className="page-grid">
                <div className="stack">
                    <OracleChat onResultsFound={setMatches} />

                    <SectionCard title={t('discover_filters_title')} subtitle={t('discover_filters_subtitle')}>
                        <form className="form-grid" onSubmit={handleFilterSubmit}>
                            <div className="profile-grid">
                                <div className="field">
                                    <label htmlFor="discover-search">{t('discover_search')}</label>
                                    <input
                                        id="discover-search"
                                        name="search"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                        placeholder={t('discover_search_placeholder')}
                                    />
                                </div>
                                <div className="field">
                                    <label htmlFor="discover-intensity">{t('discover_intensity')}</label>
                                    <select id="discover-intensity" name="intensity" value={filters.intensity} onChange={handleFilterChange}>
                                        <option value="">{t('discover_any')}</option>
                                        <option value="Casual">{t('common_casual')}</option>
                                        <option value="Dedicated">{t('common_dedicated')}</option>
                                        <option value="Vanguard">{t('common_vanguard')}</option>
                                    </select>
                                </div>
                                <div className="field">
                                    <label htmlFor="discover-faculty">{t('common_faculty')}</label>
                                    <select id="discover-faculty" name="faculty" value={filters.faculty} onChange={handleFilterChange}>
                                        <option value="">{t('discover_any')}</option>
                                        {FACULTY_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="field">
                                    <label htmlFor="discover-course">{t('common_course')}</label>
                                    <select id="discover-course" name="course" value={filters.course} onChange={handleFilterChange}>
                                        <option value="">{t('discover_any')}</option>
                                        {COURSE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="field">
                                    <label htmlFor="discover-year">{t('common_academic_year')}</label>
                                    <select id="discover-year" name="academic_year" value={filters.academic_year} onChange={handleFilterChange}>
                                        <option value="">{t('discover_any')}</option>
                                        {ACADEMIC_YEAR_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="field">
                                    <label htmlFor="discover-goal">{t('discover_goal')}</label>
                                    <input id="discover-goal" name="goal" value={filters.goal} onChange={handleFilterChange} placeholder={t('discover_goal_placeholder')} />
                                </div>
                                <div className="field">
                                    <label htmlFor="discover-skill">{t('discover_skill')}</label>
                                    <input id="discover-skill" name="skill" value={filters.skill} onChange={handleFilterChange} placeholder={t('discover_skill_placeholder')} />
                                </div>
                                <div className="field">
                                    <label htmlFor="discover-interest">{t('discover_interest')}</label>
                                    <input id="discover-interest" name="interest" value={filters.interest} onChange={handleFilterChange} placeholder={t('discover_interest_placeholder')} />
                                </div>
                            </div>

                            <div className="inline-actions">
                                <button className="primary-button" type="submit">{t('discover_apply')}</button>
                                <button className="ghost-button" type="button" onClick={handleFilterReset}>{t('discover_reset')}</button>
                            </div>
                        </form>
                    </SectionCard>

                    <SectionCard
                        title={t('discover_ranked_title')}
                        subtitle={t('discover_ranked_subtitle')}
                    >
                        <section className="results-grid">
                            {matches.length > 0 ? (
                                matches.map((match) => (
                                    <MatchCard
                                        key={match.id}
                                        match={match}
                                        onConnect={handleConnectRequest}
                                    />
                                ))
                            ) : (
                                <div className="empty-state">
                                    <p>{t('discover_no_matches')}</p>
                                </div>
                            )}
                        </section>
                    </SectionCard>
                </div>

                <div className="stack">
                    <SectionCard
                        title={t('discover_incoming_title')}
                        subtitle={t('discover_incoming_subtitle')}
                    >
                        {pendingRequests.length > 0 ? (
                            <section className="request-list">
                                {pendingRequests.map((request) => (
                                    <div key={request.id} className="request-card">
                                        <div className="split-row">
                                            <div>
                                                <strong>{request.name || request.email}</strong>
                                                <div className="soft-copy">{request.email}</div>
                                            </div>
                                            <span className={`intensity-badge ${String(request.intensity_level || 'dedicated').toLowerCase()}`}>
                                                {localizeIntensity(request.intensity_level)}
                                            </span>
                                        </div>
                                        <div className="inline-actions" style={{ marginTop: '14px' }}>
                                            <button
                                                className="primary-button"
                                                onClick={() => handleRequestResponse(request.id, 'accepted')}
                                            >
                                                {t('common_accept')}
                                            </button>
                                            <button
                                                className="ghost-button"
                                                onClick={() => handleRequestResponse(request.id, 'declined')}
                                            >
                                                {t('common_decline')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </section>
                        ) : (
                            <div className="empty-state">
                                <p>{t('discover_no_requests')}</p>
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard
                        title={t('discover_tips_title')}
                        subtitle={t('discover_tips_subtitle')}
                    >
                        <div className="tag-row">
                            <span className="tag">{t('discover_tip_faculty')}</span>
                            <span className="tag">{t('discover_tip_goals')}</span>
                            <span className="tag">{t('discover_tip_skills')}</span>
                            <span className="tag">{t('discover_tip_pace')}</span>
                            <span className="tag">{t('discover_tip_oracle')}</span>
                        </div>
                    </SectionCard>
                </div>
            </div>
        </div>
    );
};

export default Discover;
