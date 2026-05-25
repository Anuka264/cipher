import API from './api';

export const getMyCrews = async () => {
    const response = await API.get('/crews/my-crews');
    return response.data;
};

export const createCrew = async (crewData) => {
    const response = await API.post('/crews', crewData);
    return response.data;
};

export const joinCrew = async (crewId) => {
    const response = await API.post(`/crews/${crewId}/join`);
    return response.data;
};

export const getCrewDashboard = async (crewId) => {
    const response = await API.get(`/crews/${crewId}`);
    return response.data;
};

export const getCrewHistory = async (crewId) => {
    const response = await API.get(`/crews/${crewId}/history`);
    return response.data;
};

export const addCrewMember = async (crewId, payload) => {
    const response = await API.post(`/crews/${crewId}/members`, payload);
    return response.data;
};

export const removeCrewMember = async (crewId, memberUserId) => {
    const response = await API.delete(`/crews/${crewId}/members/${memberUserId}`);
    return response.data;
};

export const createTask = async (crewId, payload) => {
    const response = await API.post(`/crews/${crewId}/tasks`, payload);
    return response.data;
};

export const updateTask = async (crewId, taskId, payload) => {
    const response = await API.patch(`/crews/${crewId}/tasks/${taskId}`, payload);
    return response.data;
};

export const deleteTask = async (crewId, taskId) => {
    const response = await API.delete(`/crews/${crewId}/tasks/${taskId}`);
    return response.data;
};

export const createEvent = async (crewId, payload) => {
    const response = await API.post(`/crews/${crewId}/events`, payload);
    return response.data;
};

export const deleteEvent = async (crewId, eventId) => {
    const response = await API.delete(`/crews/${crewId}/events/${eventId}`);
    return response.data;
};

export const createMilestone = async (crewId, payload) => {
    const response = await API.post(`/crews/${crewId}/milestones`, payload);
    return response.data;
};

export const updateMilestone = async (crewId, milestoneId, payload) => {
    const response = await API.patch(`/crews/${crewId}/milestones/${milestoneId}`, payload);
    return response.data;
};

export const deleteMilestone = async (crewId, milestoneId) => {
    const response = await API.delete(`/crews/${crewId}/milestones/${milestoneId}`);
    return response.data;
};

// ===== JOIN REQUEST ENDPOINTS =====

export const getJoinRequests = async (crewId) => {
    const response = await API.get(`/crews/${crewId}/join-requests`);
    return response.data;
};

export const approveJoinRequest = async (crewId, requestId) => {
    const response = await API.patch(`/crews/${crewId}/join-requests/${requestId}/approve`);
    return response.data;
};

export const rejectJoinRequest = async (crewId, requestId) => {
    const response = await API.patch(`/crews/${crewId}/join-requests/${requestId}/reject`);
    return response.data;
};
