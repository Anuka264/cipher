import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatLanguageOptions, uiLanguageOptions, useI18n } from '../context/I18nContext';

const NAV_ITEMS = [
    { to: '/discover', labelKey: 'nav_discover', icon: '🧭' },
    { to: '/connections', labelKey: 'nav_connections', icon: '🤝' },
    { to: '/messages', labelKey: 'nav_messages', icon: '💬' },
    { to: '/notifications', labelKey: 'nav_notifications', icon: '🔔' },
    { to: '/crews', labelKey: 'nav_crews', icon: '🚀' },
    { to: '/profile', labelKey: 'nav_profile', icon: '🪪' },
    { to: '/onboarding', labelKey: 'nav_onboarding', icon: '✨' }
];

const AppLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { session, logout } = useAuth();
    const { t } = useI18n();

    const activeRoute = NAV_ITEMS.find((item) => (
        location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
    ));
    const appLanguageLabel = uiLanguageOptions.find((item) => item.value === session?.app_language)?.label || 'English';
    const chatLanguageLabel = chatLanguageOptions.find((item) => item.value === session?.preferred_chat_language)?.label
        || appLanguageLabel;

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="brand-mark">◌ Cipher</div>
                <h1 className="brand-title">{t('shell_brand_title')}</h1>

                <nav className="nav-list">
                    {NAV_ITEMS.map((item) => (
                        <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                            <span>{t(item.labelKey)}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="inline-actions">
                        <button className="ghost-button" onClick={() => navigate('/profile')}>
                            {t('shell_view_profile')}
                        </button>
                        <button className="danger-button" onClick={handleLogout}>
                            {t('shell_logout')}
                        </button>
                    </div>
                </div>
            </aside>

            <main className="content-area">
                <div className="shell-topbar">
                    <div className="shell-orbit">
                        <span className="status-pill">{t('shell_live_profile')}</span>
                        <span className="tag">🌐 {t('shell_lang')}: {appLanguageLabel}</span>
                        <span className="tag">💬 {t('shell_chat')}: {chatLanguageLabel}</span>
                    </div>
                    <div className="soft-copy">
                        {activeRoute ? `${activeRoute.icon} ${t(activeRoute.labelKey)}` : `🏠 ${t('shell_home')}`}
                    </div>
                </div>
                <Outlet />
            </main>
        </div>
    );
};

export default AppLayout;
