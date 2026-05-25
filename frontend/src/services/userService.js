import API from './api';

export const registerUser = async (credentials) => {
    const response = await API.post('/users/register', credentials);
    return response.data;
};

export const loginUser = async (credentials) => {
    const response = await API.post('/users/login', credentials);
    return response.data;
};

export const completeOnboarding = async (onboardingData) => {
    const response = await API.post('/users/onboarding', onboardingData);
    return response.data;
};

export const getCurrentUser = async () => {
    const response = await API.get('/users/me');
    return response.data;
};

export const updateProfile = async (payload) => {
    const response = await API.patch('/users/profile', payload);
    return response.data;
};

export const updateAccountCredentials = async (payload) => {
    const response = await API.patch('/users/account', payload);
    return response.data;
};

export const getMatches = async (filters = {}) => {
    const response = await API.get('/users/matches', { params: filters });
    return response.data;
};

export const getNotifications = async () => {
    const response = await API.get('/users/notifications');
    return response.data;
};

export const markNotificationRead = async (notificationId) => {
    const response = await API.patch(`/users/notifications/${notificationId}/read`);
    return response.data;
};

export const markAllNotificationsRead = async () => {
    const response = await API.patch('/users/notifications/read-all');
    return response.data;
};
