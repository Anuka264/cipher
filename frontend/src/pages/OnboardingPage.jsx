import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionCard from '../components/SectionCard';
import {
    ACADEMIC_YEAR_OPTIONS,
    COURSE_OPTIONS,
    FACULTY_OPTIONS,
    GOAL_GROUPS,
    INTEREST_GROUPS,
    SKILL_GROUPS
} from '../constants/profileOptions';
import { useAuth } from '../context/AuthContext';
import { chatLanguageOptions, uiLanguageOptions, useI18n } from '../context/I18nContext';
import { completeOnboarding } from '../services/userService';

const toggleValue = (values, nextValue) => (
    values.includes(nextValue)
        ? values.filter((value) => value !== nextValue)
        : [...values, nextValue]
);

const OptionGroup = ({ title, subtitle, options, selectedValues, onToggle, t }) => (
    <div className="option-group">
        <div className="option-group-header">
            <strong>{title}</strong>
            <span className="soft-copy">{subtitle}</span>
        </div>
        <div className="option-grid">
            {options.map((option) => {
                const active = selectedValues.includes(option.value);
                return (
                    <button
                        key={option.value}
                        type="button"
                        className={`option-pill${active ? ' active' : ''}`}
                        onClick={() => onToggle(option.value)}
                        aria-pressed={active}
                    >
                        <span className="option-pill-indicator">{active ? t('common_selected') : t('common_pick')}</span>
                        {t(option.labelKey)}
                    </button>
                );
            })}
        </div>
    </div>
);

const CollapsibleSection = ({ title, subtitle, isOpen, onToggle, children, badge, t }) => (
    <SectionCard title={title} subtitle={subtitle}>
        <div className="split-row" style={{ marginBottom: isOpen ? '16px' : 0 }}>
            <div className="tag-row" style={{ marginTop: 0 }}>
                {badge ? <span className="tag">{badge}</span> : null}
            </div>
            <button className="ghost-button" type="button" onClick={onToggle}>
                {isOpen ? t('common_hide') : t('common_open')}
            </button>
        </div>
        {isOpen ? children : null}
    </SectionCard>
);

const OnboardingPage = () => {
    const navigate = useNavigate();
    const { markOnboardingComplete, session } = useAuth();
    const { t, setLocale } = useI18n();
    const [openSection, setOpenSection] = useState('goals');
    const [form, setForm] = useState({
        name: session?.name || '',
        intensity_level: session?.intensity_level || 'Dedicated',
        faculty: session?.faculty || '',
        course: session?.course || '',
        academic_year: session?.academic_year || '',
        profile_visibility: session?.profile_visibility || 'public',
        app_language: uiLanguageOptions.some((language) => language.value === session?.app_language)
            ? session?.app_language
            : 'en',
        preferred_chat_language: chatLanguageOptions.some((language) => language.value === session?.preferred_chat_language)
            ? session?.preferred_chat_language
            : (uiLanguageOptions.some((language) => language.value === session?.app_language) ? session?.app_language : 'en'),
        bio: session?.raw_bio || '',
        goals: Array.isArray(session?.goals) ? session.goals : [],
        skills: Array.isArray(session?.skills) ? session.skills : [],
        interests: Array.isArray(session?.interests) ? session.interests : []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const selectionSummary = useMemo(() => ({
        goals: form.goals.length,
        skills: form.skills.length,
        interests: form.interests.length
    }), [form.goals.length, form.skills.length, form.interests.length]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const handleToggle = (key, value) => {
        setForm((current) => ({
            ...current,
            [key]: toggleValue(current[key], value)
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            const profile = await completeOnboarding(form);
            markOnboardingComplete(profile);
            setLocale(profile.app_language || form.app_language || 'en');
            navigate('/discover');
        } catch (submitError) {
            setError(submitError?.response?.data?.error || t('onboarding_failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <header className="page-header">
                <div>
                    <div className="brand-mark">{t('onboarding_brand')}</div>
                    <h1>{t('onboarding_title')}</h1>
                    <p className="soft-copy">{t('onboarding_subtitle')}</p>
                </div>
                <div className="mini-stat-grid" style={{ width: 'min(420px, 100%)' }}>
                    <div className="mini-stat">
                        {t('onboarding_goals_count')}
                        <strong>{selectionSummary.goals}</strong>
                    </div>
                    <div className="mini-stat">
                        {t('onboarding_skills_count')}
                        <strong>{selectionSummary.skills}</strong>
                    </div>
                    <div className="mini-stat">
                        {t('onboarding_interests_count')}
                        <strong>{selectionSummary.interests}</strong>
                    </div>
                </div>
            </header>

            {error && <div className="error-banner">{error}</div>}

            <form className="page" onSubmit={handleSubmit}>
                <SectionCard
                    title={t('onboarding_core_title')}
                    subtitle={t('onboarding_core_subtitle')}
                >
                    <div className="profile-grid">
                        <div className="field">
                            <label htmlFor="name">{t('onboarding_display_name')}</label>
                            <input id="name" name="name" value={form.name} onChange={handleChange} required />
                        </div>

                        <div className="field">
                            <label htmlFor="intensity_level">{t('discover_intensity')}</label>
                            <select id="intensity_level" name="intensity_level" value={form.intensity_level} onChange={handleChange}>
                                <option value="Casual">{t('common_casual')}</option>
                                <option value="Dedicated">{t('common_dedicated')}</option>
                                <option value="Vanguard">{t('common_vanguard')}</option>
                            </select>
                        </div>

                        <div className="field">
                            <label htmlFor="profile_visibility">{t('common_visibility')}</label>
                            <select id="profile_visibility" name="profile_visibility" value={form.profile_visibility} onChange={handleChange}>
                                <option value="public">{t('common_public')}</option>
                                <option value="campus">{t('common_campus_only')}</option>
                                <option value="private">{t('common_private')}</option>
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="app_language">{t('profile_app_language')}</label>
                            <select id="app_language" name="app_language" value={form.app_language} onChange={handleChange}>
                                {uiLanguageOptions.map((language) => (
                                    <option key={language.value} value={language.value}>{language.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="preferred_chat_language">{t('profile_chat_language')}</label>
                            <select id="preferred_chat_language" name="preferred_chat_language" value={form.preferred_chat_language} onChange={handleChange}>
                                {chatLanguageOptions.map((language) => (
                                    <option key={language.value} value={language.value}>{language.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </SectionCard>

                <CollapsibleSection
                    title={t('onboarding_goals_section_title')}
                    subtitle={t('onboarding_goals_section_subtitle')}
                    isOpen={openSection === 'goals'}
                    onToggle={() => setOpenSection(openSection === 'goals' ? '' : 'goals')}
                    badge={`${selectionSummary.goals} ${t('common_selected')}`}
                    t={t}
                >
                    <div className="stack">
                        {GOAL_GROUPS.map((group) => (
                            <OptionGroup
                                key={group.key}
                                title={t(group.titleKey)}
                                subtitle={t(group.subtitleKey)}
                                options={group.options}
                                selectedValues={form.goals}
                                onToggle={(value) => handleToggle('goals', value)}
                                t={t}
                            />
                        ))}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection
                    title={t('onboarding_skills_section_title')}
                    subtitle={t('onboarding_skills_section_subtitle')}
                    isOpen={openSection === 'skills'}
                    onToggle={() => setOpenSection(openSection === 'skills' ? '' : 'skills')}
                    badge={`${selectionSummary.skills} ${t('common_selected')}`}
                    t={t}
                >
                    <div className="stack">
                        {SKILL_GROUPS.map((group) => (
                            <OptionGroup
                                key={group.key}
                                title={t(group.titleKey)}
                                subtitle={t(group.subtitleKey)}
                                options={group.options}
                                selectedValues={form.skills}
                                onToggle={(value) => handleToggle('skills', value)}
                                t={t}
                            />
                        ))}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection
                    title={t('onboarding_interests_section_title')}
                    subtitle={t('onboarding_interests_section_subtitle')}
                    isOpen={openSection === 'interests'}
                    onToggle={() => setOpenSection(openSection === 'interests' ? '' : 'interests')}
                    badge={`${selectionSummary.interests} ${t('common_selected')}`}
                    t={t}
                >
                    <div className="stack">
                        {INTEREST_GROUPS.map((group) => (
                            <OptionGroup
                                key={group.key}
                                title={t(group.titleKey)}
                                subtitle={t(group.subtitleKey)}
                                options={group.options}
                                selectedValues={form.interests}
                                onToggle={(value) => handleToggle('interests', value)}
                                t={t}
                            />
                        ))}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection
                    title={t('onboarding_extra_title')}
                    subtitle={t('onboarding_extra_subtitle')}
                    isOpen={openSection === 'extra'}
                    onToggle={() => setOpenSection(openSection === 'extra' ? '' : 'extra')}
                    badge={t('common_optional')}
                    t={t}
                >
                    <div className="stack">
                        <div className="profile-grid">
                            <div className="field">
                                <label htmlFor="faculty">{t('common_faculty')}</label>
                                <select id="faculty" name="faculty" value={form.faculty} onChange={handleChange}>
                                    <option value="">{t('common_choose_faculty')}</option>
                                    {FACULTY_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="field">
                                <label htmlFor="course">{t('common_course')}</label>
                                <select id="course" name="course" value={form.course} onChange={handleChange}>
                                    <option value="">{t('common_choose_course')}</option>
                                    {COURSE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="field">
                                <label htmlFor="academic_year">{t('common_academic_year')}</label>
                                <select id="academic_year" name="academic_year" value={form.academic_year} onChange={handleChange}>
                                    <option value="">{t('common_choose_academic_year')}</option>
                                    {ACADEMIC_YEAR_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="field">
                            <label htmlFor="bio">{t('onboarding_short_bio')}</label>
                            <textarea
                                id="bio"
                                name="bio"
                                value={form.bio}
                                onChange={handleChange}
                                placeholder={t('onboarding_bio_placeholder')}
                            />
                        </div>
                    </div>
                </CollapsibleSection>

                <div className="inline-actions">
                    <button className="primary-button" type="submit" disabled={loading}>
                        {loading ? t('onboarding_loading') : t('onboarding_complete')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default OnboardingPage;
