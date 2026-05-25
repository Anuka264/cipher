import API from './api';

export const sendConnectionRequest = async (receiverId) => {
    const response = await API.post('/users/connections/request', { receiverId });
    return response.data;
};

export const getPendingRequests = async () => {
    const response = await API.get('/users/connections/pending');
    return response.data;
};

export const respondToConnectionRequest = async (connectionId, action) => {
    const response = await API.patch(`/users/connections/${connectionId}`, { action });
    return response.data;
};

export const getConnections = async () => {
    const response = await API.get('/users/connections');
    return response.data;
};
