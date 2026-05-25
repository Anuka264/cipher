import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { loginUser, registerUser } from '../services/userService';

const AuthPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { saveAuth } = useAuth();
    const { t, setLocale } = useI18n();
    const [mode, setMode] = useState('register');
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = mode === 'register'
                ? await registerUser(form)
                : await loginUser(form);

            saveAuth({
                ...payload,
                hasCompletedOnboarding: payload.hasCompletedOnboarding ?? false
            });
            if (payload.app_language) {
                setLocale(payload.app_language);
            }

            navigate(location.state?.from || (payload.hasCompletedOnboarding ? '/discover' : '/onboarding'));
        } catch (submissionError) {
            setError(submissionError?.response?.data?.error || submissionError?.response?.data?.details || t('auth_failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-shell">
            <section className="auth-hero">
                <div className="auth-copy">
                    <div className="brand-mark">◌ {t('auth_brand')}</div>
                    <h1>{t('auth_hero_title')}</h1>
                    <div className="hero-chip-row">
                        <span className="hero-chip">🧭 {t('auth_chip_find')}</span>
                        <span className="hero-chip">🤝 {t('auth_chip_connect')}</span>
                        <span className="hero-chip">🚀 {t('auth_chip_build')}</span>
                    </div>
                    <div className="auth-showcase">
                        <div className="auth-device-card">
                            <div className="auth-device-top">
                                <span className="status-pill">◉ Cipher</span>
                                <span className="tag">Live</span>
                            </div>
                            <div className="auth-device-center">
                                <div className="auth-device-title">{t('auth_scene_ai')}</div>
                                <div className="auth-device-meter">
                                    <span>61%</span>
                                    <small>{t('auth_visual_signal')}</small>
                                </div>
                            </div>
                            <div className="auth-device-orbits">
                                <span className="auth-orbit orbit-one" />
                                <span className="auth-orbit orbit-two" />
                                <span className="auth-orbit orbit-three" />
                            </div>
                        </div>

                        <div className="auth-floating-stack">
                            <article className="auth-floating-card signal-card">
                                <span className="scene-icon">🎯</span>
                                <div>
                                    <strong>{t('auth_visual_signal')}</strong>
                                    <p>{t('auth_visual_signal_value')}</p>
                                </div>
                            </article>
                            <article className="auth-floating-card language-card">
                                <span className="scene-icon">🌍</span>
                                <div>
                                    <strong>{t('auth_visual_stage')}</strong>
                                    <p>{t('auth_visual_stage_value')}</p>
                                </div>
                            </article>
                            <article className="auth-floating-card sync-card">
                                <span className="scene-icon">⚡</span>
                                <div>
                                    <strong>{t('auth_visual_sync')}</strong>
                                    <p>{t('auth_visual_sync_value')}</p>
                                </div>
                            </article>
                        </div>
                    </div>

                    <div className="auth-scene">
                        <div className="scene-card">
                            <span className="scene-icon">🎯</span>
                            <strong>{t('auth_scene_ai')}</strong>
                        </div>
                        <div className="scene-card">
                            <span className="scene-icon">🌍</span>
                            <strong>{t('auth_scene_multilingual')}</strong>
                        </div>
                        <div className="scene-card">
                            <span className="scene-icon">🎮</span>
                            <strong>{t('auth_scene_social')}</strong>
                        </div>
                    </div>
                </div>
            </section>

            <section className="auth-card-wrap">
                <div className="auth-card">
                    <div className="tab-row">
                        <button
                            className={`tab-button${mode === 'register' ? ' active' : ''}`}
                            onClick={() => setMode('register')}
                            type="button"
                        >
                            {t('auth_register')}
                        </button>
                        <button
                            className={`tab-button${mode === 'login' ? ' active' : ''}`}
                            onClick={() => setMode('login')}
                            type="button"
                        >
                            {t('auth_login')}
                        </button>
                    </div>

                    <h1>{mode === 'register' ? t('auth_title_register') : t('auth_title_login')}</h1>
                    <p className="soft-copy">
                        {t('auth_subtitle')}
                    </p>

                    {error && <div className="error-banner">{error}</div>}

                    <form className="form-grid" onSubmit={handleSubmit}>
	                        <div className="field">
	                            <label htmlFor="email">{t('auth_email')}</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder={t('auth_email_placeholder')}
                                autoComplete="email"
                                required
                            />
                        </div>

	                        <div className="field">
	                            <label htmlFor="password">{t('auth_password')}</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder={t('auth_password_placeholder')}
                                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                                minLength={6}
                                required
                            />
                        </div>

	                        <button className="primary-button" type="submit" disabled={loading}>
	                            {loading ? t('auth_wait') : mode === 'register' ? t('auth_create_account') : t('auth_login_submit')}
	                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
};

export default AuthPage;
