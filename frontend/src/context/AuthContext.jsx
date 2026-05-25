import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'cipher_session';
const AuthContext = createContext(null);

const readStoredSession = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(readStoredSession);

    const persistSession = useCallback((nextSessionOrUpdater) => {
        setSession((currentSession) => {
            const nextSession = typeof nextSessionOrUpdater === 'function'
                ? nextSessionOrUpdater(currentSession)
                : nextSessionOrUpdater;

            if (nextSession) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
                localStorage.setItem('token', nextSession.token || '');
            } else {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem('token');
            }

            return nextSession;
        });
    }, []);

    const saveAuth = useCallback((payload) => {
        persistSession((currentSession) => ({
            ...currentSession,
            ...payload,
            hasCompletedOnboarding: payload.hasCompletedOnboarding ?? currentSession?.hasCompletedOnboarding ?? false
        }));
    }, [persistSession]);

    const markOnboardingComplete = useCallback((profile) => {
        persistSession((currentSession) => ({
            ...currentSession,
            ...profile,
            hasCompletedOnboarding: true
        }));
    }, [persistSession]);

    const updateSession = useCallback((payload) => {
        persistSession((currentSession) => ({
            ...currentSession,
            ...payload,
            hasCompletedOnboarding: payload?.hasCompletedOnboarding ?? currentSession?.hasCompletedOnboarding ?? false
        }));
    }, [persistSession]);

    const logout = useCallback(() => persistSession(null), [persistSession]);

    const value = useMemo(() => ({
        session,
        isAuthenticated: Boolean(session?.token),
        saveAuth,
        markOnboardingComplete,
        updateSession,
        logout
    }), [session]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
