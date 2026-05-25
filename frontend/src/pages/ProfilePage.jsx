import React, { useEffect, useMemo, useRef, useState } from 'react';
import SectionCard from '../components/SectionCard';
import AvatarFrame from '../components/AvatarFrame';
import {
    ACADEMIC_YEAR_OPTIONS,
    COURSE_OPTIONS,
    FACULTY_OPTIONS,
    getSignalLabelKey,
    getOptionLabelKey
} from '../constants/profileOptions';
import { useAuth } from '../context/AuthContext';
import { chatLanguageOptions, uiLanguageOptions, useI18n } from '../context/I18nContext';
import { getCurrentUser, updateAccountCredentials, updateProfile } from '../services/userService';

const renderTags = (values, t) => {
    if (!Array.isArray(values) || !values.length) {
        return <span className="soft-copy">{t('profile_not_extracted')}</span>;
    }

    return (
        <div className="tag-row">
            {values.map((value) => (
                <span key={value} className="tag">{getSignalLabelKey(value) ? t(getSignalLabelKey(value)) : value}</span>
            ))}
        </div>
    );
};

const emptyForm = {
    name: '',
    bio: '',
    intensity_level: 'Dedicated',
    faculty: '',
    course: '',
    academic_year: '',
    profile_visibility: 'public',
    profile_photo_url: '',
    app_language: 'en',
    preferred_chat_language: 'en'
};

const createPresetAvatar = ({ palette, accent, hair, accessory, badge, mood }) => (
    `data:image/svg+xml;utf8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
            <defs>
                <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stop-color="${palette[0]}"/>
                    <stop offset="100%" stop-color="${palette[1]}"/>
                </linearGradient>
            </defs>
            <rect width="160" height="160" rx="42" fill="url(#g)"/>
            <circle cx="80" cy="80" r="48" fill="rgba(255,255,255,0.14)"/>
            <path d="M38 136c8-28 28-42 42-42h0c14 0 34 14 42 42" fill="rgba(17,30,42,0.34)"/>
            <ellipse cx="80" cy="74" rx="34" ry="38" fill="#ffd8bf"/>
            <path d="${hair}" fill="${accent}"/>
            <circle cx="67" cy="77" r="4" fill="#182430"/>
            <circle cx="93" cy="77" r="4" fill="#182430"/>
            <path d="${mood}" stroke="#9c4f47" stroke-width="4" stroke-linecap="round" fill="none"/>
            <path d="${accessory}" fill="rgba(255,255,255,0.78)"/>
            <text x="80" y="144" text-anchor="middle" font-size="18" fill="#f8fbff" font-family="Segoe UI, sans-serif">${badge}</text>
        </svg>
    `)}`
);

const PRESET_AVATARS = [
    {
        id: 'nova',
        labelKey: 'avatar_preset_nova',
        src: createPresetAvatar({
            palette: ['#2a85ff', '#8ff0d2'],
            accent: '#102a43',
            hair: 'M44 70c4-26 22-42 36-42 16 0 38 18 40 48-10-12-24-18-40-18-14 0-28 4-36 12z',
            accessory: 'M55 60h50l-8 10H63z',
            badge: 'N',
            mood: 'M67 96c6 6 20 6 26 0'
        })
    },
    {
        id: 'pixel',
        labelKey: 'avatar_preset_pixel',
        src: createPresetAvatar({
            palette: ['#7c65ff', '#21c8f6'],
            accent: '#31214d',
            hair: 'M46 68c8-22 22-34 36-34 18 0 34 12 40 30-10-4-20-6-30-6-20 0-34 4-46 10z',
            accessory: 'M54 86h52v10H54z',
            badge: 'P',
            mood: 'M66 98c5 3 23 3 28 0'
        })
    },
    {
        id: 'echo',
        labelKey: 'avatar_preset_echo',
        src: createPresetAvatar({
            palette: ['#ff9f68', '#ff5d8f'],
            accent: '#5a2337',
            hair: 'M42 74c2-28 22-42 40-42 22 0 38 16 40 40-14-8-26-12-42-12-14 0-28 4-38 14z',
            accessory: 'M50 58c10-12 20-18 30-18s20 6 30 18l-8 8c-6-8-14-12-22-12s-16 4-22 12z',
            badge: 'E',
            mood: 'M68 96c4 7 18 7 24 0'
        })
    },
    {
        id: 'moss',
        labelKey: 'avatar_preset_moss',
        src: createPresetAvatar({
            palette: ['#1e9f72', '#95e06c'],
            accent: '#214734',
            hair: 'M46 70c8-24 24-38 38-38 18 0 34 12 40 32-14-6-28-8-42-8-14 0-24 4-36 14z',
            accessory: 'M62 56h36l-4 8H66z',
            badge: 'M',
            mood: 'M66 98c7 4 21 4 28 0'
        })
    }
];

const ProfilePage = () => {
    const fileInputRef = useRef(null);
    const { session, updateSession } = useAuth();
    const { t, setLocale } = useI18n();
    const [profile, setProfile] = useState(session || null);
    const [photoPreview, setPhotoPreview] = useState(session?.profile_photo_url || '');
    const [form, setForm] = useState({
        ...emptyForm,
        name: session?.name || '',
        bio: session?.raw_bio || '',
        intensity_level: session?.intensity_level || 'Dedicated',
        faculty: session?.faculty || '',
        course: session?.course || '',
        academic_year: session?.academic_year || '',
        profile_visibility: session?.profile_visibility || 'public',
        profile_photo_url: session?.profile_photo_url || '',
        app_language: uiLanguageOptions.some((language) => language.value === session?.app_language)
            ? session?.app_language
            : 'en',
        preferred_chat_language: chatLanguageOptions.some((language) => language.value === session?.preferred_chat_language)
            ? session?.preferred_chat_language
            : (uiLanguageOptions.some((language) => language.value === session?.app_language) ? session?.app_language : 'en')
    });
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [accountStatus, setAccountStatus] = useState('');
    const [accountError, setAccountError] = useState('');
    const [accountForm, setAccountForm] = useState({
        email: session?.email || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    useEffect(() => {
        const run = async () => {
            try {
                const currentUser = await getCurrentUser();
                setProfile(currentUser);
                setForm({
                    ...emptyForm,
                    name: currentUser?.name || '',
                    bio: currentUser?.raw_bio || '',
                    intensity_level: currentUser?.intensity_level || 'Dedicated',
                    faculty: currentUser?.faculty || '',
                    course: currentUser?.course || '',
                    academic_year: currentUser?.academic_year || '',
                    profile_visibility: currentUser?.profile_visibility || 'public',
                    profile_photo_url: currentUser?.profile_photo_url || '',
                    app_language: uiLanguageOptions.some((language) => language.value === currentUser?.app_language)
                        ? currentUser?.app_language
                        : 'en',
                    preferred_chat_language: chatLanguageOptions.some((language) => language.value === currentUser?.preferred_chat_language)
                        ? currentUser?.preferred_chat_language
                        : (uiLanguageOptions.some((language) => language.value === currentUser?.app_language) ? currentUser?.app_language : 'en')
                });
                setPhotoPreview(currentUser?.profile_photo_url || '');
                updateSession(currentUser);
                setAccountForm((current) => ({
                    ...current,
                    email: currentUser?.email || '',
                    current_password: '',
                    new_password: '',
                    confirm_password: ''
                }));
            } catch (loadError) {
                setError(t('profile_load_error'));
            }
        };

        run();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const handleAccountChange = (event) => {
        const { name, value } = event.target;
        setAccountForm((current) => ({ ...current, [name]: value }));
    };

    const handleAvatarChoose = (src) => {
        setForm((current) => ({ ...current, profile_photo_url: src }));
        setPhotoPreview(src);
    };

    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setPhotoPreview(previewUrl);

        const reader = new FileReader();
        reader.onload = () => {
            const nextValue = typeof reader.result === 'string' ? reader.result : '';
            setForm((current) => ({
                ...current,
                profile_photo_url: nextValue || current.profile_photo_url
            }));
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setStatus('');
        setError('');

        try {
            const updated = await updateProfile(form);
            setProfile(updated);
            setPhotoPreview(updated.profile_photo_url || '');
            updateSession(updated);
            setLocale(updated.app_language || 'en');
            setStatus(t('profile_saved'));
        } catch (submitError) {
            setError(
                submitError?.response?.data?.details
                || submitError?.response?.data?.error
                || t('profile_update_error')
            );
        }
    };

    const handleAccountSubmit = async (event) => {
        event.preventDefault();
        setAccountStatus('');
        setAccountError('');

        if (accountForm.new_password && accountForm.new_password !== accountForm.confirm_password) {
            setAccountError(t('profile_account_mismatch'));
            return;
        }

        try {
            const updated = await updateAccountCredentials({
                email: accountForm.email,
                current_password: accountForm.current_password,
                new_password: accountForm.new_password
            });
            setProfile(updated);
            updateSession(updated);
            setAccountForm((current) => ({
                ...current,
                email: updated.email || '',
                current_password: '',
                new_password: '',
                confirm_password: ''
            }));
            setAccountStatus(t('profile_account_updated'));
        } catch (submitError) {
            setAccountError(
                submitError?.response?.data?.details
                || submitError?.response?.data?.error
                || t('profile_account_error')
            );
        }
    };

    const localizeAcademic = (value, options) => {
        const labelKey = getOptionLabelKey(options, value);
        return labelKey ? t(labelKey) : value;
    };

    const localizeIntensity = (value) => {
        const map = {
            Casual: 'common_casual',
            Dedicated: 'common_dedicated',
            Vanguard: 'common_vanguard'
        };

        return map[value] ? t(map[value]) : value;
    };

    const localizeVisibility = (value) => {
        const map = {
            public: 'common_public',
            campus: 'common_campus_only',
            private: 'common_private'
        };

        return map[value] ? t(map[value]) : value;
    };

    const profileMeta = useMemo(
        () => [
            localizeAcademic(profile?.faculty, FACULTY_OPTIONS),
            localizeAcademic(profile?.course, COURSE_OPTIONS),
            localizeAcademic(profile?.academic_year, ACADEMIC_YEAR_OPTIONS)
        ].filter(Boolean).join(' • '),
        [profile?.faculty, profile?.course, profile?.academic_year, t]
    );

    return (
        <div className="page">
            <header className="page-header profile-hero">
                <div className="profile-hero-main">
                    <AvatarFrame src={photoPreview || form.profile_photo_url || profile?.profile_photo_url} name={form.name || profile?.name} size="large" />
                    <div>
                        <div className="brand-mark">{t('profile_brand')}</div>
                        <h1>{t('profile_title')}</h1>
                        <p className="soft-copy">{t('profile_subtitle')}</p>
                    </div>
                </div>
                <div className="tag-row" style={{ marginTop: 0 }}>
                    <span className="tag">{localizeVisibility(profile?.profile_visibility || form.profile_visibility)}</span>
                    <span className="tag">{localizeIntensity(profile?.intensity_level || form.intensity_level)}</span>
                </div>
            </header>

            {status && <div className="success-banner">{status}</div>}
            {error && <div className="error-banner">{error}</div>}

            <div className="page-grid">
                <SectionCard title={t('profile_edit_title')} subtitle={t('profile_edit_subtitle')}>
                    <form className="form-grid" onSubmit={handleSubmit}>
                        <div className="avatar-editor">
                            <div className="avatar-stage">
                                <AvatarFrame src={photoPreview || form.profile_photo_url} name={form.name} size="xlarge" />
                                <div className="soft-copy">{t('profile_avatar_hint')}</div>
                            </div>

                            <div className="stack">
                                <div className="option-grid">
                                    {PRESET_AVATARS.map((avatar) => (
                                        <button
                                            key={avatar.id}
                                            type="button"
                                            className={`avatar-choice${(photoPreview || form.profile_photo_url) === avatar.src ? ' active' : ''}`}
                                            onClick={() => handleAvatarChoose(avatar.src)}
                                        >
                                            <AvatarFrame src={avatar.src} name={t(avatar.labelKey)} size="small" />
                                            <span>{t(avatar.labelKey)}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="inline-actions">
                                    <button className="ghost-button" type="button" onClick={() => fileInputRef.current?.click()}>
                                        {t('common_choose_from_device')}
                                    </button>
                                    <button className="ghost-button" type="button" onClick={() => handleAvatarChoose('')}>
                                        {t('common_use_initials')}
                                    </button>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />

                                <div className="soft-copy">
                                    {photoPreview ? t('profile_preview_updated') : t('profile_preview_initials')}
                                </div>
                            </div>
                        </div>

                        <div className="profile-grid">
                            <div className="field">
                                <label htmlFor="profile-name">{t('common_name')}</label>
                                <input id="profile-name" name="name" value={form.name} onChange={handleChange} required />
                            </div>
                            <div className="field">
                                <label htmlFor="profile-intensity">{t('discover_intensity')}</label>
                                <select id="profile-intensity" name="intensity_level" value={form.intensity_level} onChange={handleChange}>
                                    <option value="Casual">{t('common_casual')}</option>
                                    <option value="Dedicated">{t('common_dedicated')}</option>
                                    <option value="Vanguard">{t('common_vanguard')}</option>
                                </select>
                            </div>
                            <div className="field">
                                <label htmlFor="profile-faculty">{t('common_faculty')}</label>
                                <select id="profile-faculty" name="faculty" value={form.faculty} onChange={handleChange}>
                                    <option value="">{t('common_choose_faculty')}</option>
                                    {FACULTY_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label htmlFor="profile-course">{t('common_course')}</label>
                                <select id="profile-course" name="course" value={form.course} onChange={handleChange}>
                                    <option value="">{t('common_choose_course')}</option>
                                    {COURSE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label htmlFor="profile-year">{t('common_academic_year')}</label>
                                <select id="profile-year" name="academic_year" value={form.academic_year} onChange={handleChange}>
                                    <option value="">{t('common_choose_academic_year')}</option>
                                    {ACADEMIC_YEAR_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label htmlFor="profile-visibility">{t('common_visibility')}</label>
                                <select id="profile-visibility" name="profile_visibility" value={form.profile_visibility} onChange={handleChange}>
                                    <option value="public">{t('common_public')}</option>
                                    <option value="campus">{t('common_campus_only')}</option>
                                    <option value="private">{t('common_private')}</option>
                                </select>
                            </div>
                            <div className="field">
                                <label htmlFor="profile-app-language">{t('profile_app_language')}</label>
                                <select id="profile-app-language" name="app_language" value={form.app_language} onChange={handleChange}>
                                    {uiLanguageOptions.map((language) => (
                                        <option key={language.value} value={language.value}>{language.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label htmlFor="profile-chat-language">{t('profile_chat_language')}</label>
                                <select id="profile-chat-language" name="preferred_chat_language" value={form.preferred_chat_language} onChange={handleChange}>
                                    {chatLanguageOptions.map((language) => (
                                        <option key={language.value} value={language.value}>{language.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="field">
                            <label htmlFor="profile-bio">{t('common_bio')}</label>
                            <textarea
                                id="profile-bio"
                                name="bio"
                                value={form.bio}
                                onChange={handleChange}
                                placeholder={t('profile_bio_placeholder')}
                                required
                            />
                        </div>

                        <button className="primary-button" type="submit">
                            {t('profile_save')}
                        </button>
                    </form>
                </SectionCard>

                <div className="stack">
                    <SectionCard title={t('profile_account_title')} subtitle={t('profile_account_subtitle')}>
                        {accountStatus && <div className="success-banner">{accountStatus}</div>}
                        {accountError && <div className="error-banner">{accountError}</div>}
                        <form className="form-grid" onSubmit={handleAccountSubmit}>
                            <div className="field">
                                <label htmlFor="account-email">{t('common_email')}</label>
                                <input
                                    id="account-email"
                                    name="email"
                                    type="email"
                                    value={accountForm.email}
                                    onChange={handleAccountChange}
                                    autoComplete="email"
                                    required
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="account-current-password">{t('common_current_password')}</label>
                                <input
                                    id="account-current-password"
                                    name="current_password"
                                    type="password"
                                    value={accountForm.current_password}
                                    onChange={handleAccountChange}
                                    placeholder={t('profile_account_required')}
                                    autoComplete="current-password"
                                    required
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="account-new-password">{t('common_new_password')}</label>
                                <input
                                    id="account-new-password"
                                    name="new_password"
                                    type="password"
                                    value={accountForm.new_password}
                                    onChange={handleAccountChange}
                                    placeholder={t('profile_account_keep_password')}
                                    autoComplete="new-password"
                                    minLength={accountForm.new_password ? 6 : undefined}
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="account-confirm-password">{t('common_confirm_new_password')}</label>
                                <input
                                    id="account-confirm-password"
                                    name="confirm_password"
                                    type="password"
                                    value={accountForm.confirm_password}
                                    onChange={handleAccountChange}
                                    placeholder={t('profile_account_repeat_password')}
                                    autoComplete="new-password"
                                    minLength={accountForm.confirm_password ? 6 : undefined}
                                />
                            </div>
                            <button className="primary-button" type="submit">
                                {t('profile_account_save')}
                            </button>
                        </form>
                    </SectionCard>

                    <SectionCard title={t('profile_current_title')} subtitle={t('profile_current_subtitle')}>
                        <div className="profile-strip">
                            <div className="profile-strip-main">
                                <AvatarFrame src={profile?.profile_photo_url} name={profile?.name} size="medium" />
                                <div>
                                    <h3 style={{ marginTop: 0 }}>{profile?.name || t('profile_unnamed')}</h3>
                                    <div className="soft-copy">{profile?.email}</div>
                                    <div className="soft-copy">{profileMeta || t('profile_meta_empty')}</div>
                                </div>
                            </div>
                            {profile?.intensity_level && (
                                <span className={`intensity-badge ${String(profile.intensity_level).toLowerCase()}`}>
                                    {localizeIntensity(profile.intensity_level)}
                                </span>
                            )}
                        </div>

                        <div className="field" style={{ marginTop: '18px' }}>
                            <label>{t('profile_summary_label')}</label>
                            <div className="match-bio">{profile?.profile_summary || t('profile_summary_empty')}</div>
                        </div>
                    </SectionCard>

                    <SectionCard title={t('profile_goals_title')} subtitle={t('profile_goals_subtitle')}>
                        {renderTags(profile?.goals, t)}
                    </SectionCard>
                    <SectionCard title={t('profile_skills_title')} subtitle={t('profile_skills_subtitle')}>
                        {renderTags(profile?.skills, t)}
                    </SectionCard>
                    <SectionCard title={t('profile_interests_title')} subtitle={t('profile_interests_subtitle')}>
                        {renderTags(profile?.interests, t)}
                    </SectionCard>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
