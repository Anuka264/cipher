import API from './api';

export const getConversations = async () => {
    const response = await API.get('/users/messages/conversations');
    return response.data;
};

export const getConversationMessages = async (userId) => {
    const response = await API.get(`/users/messages/${userId}`);
    return response.data;
};

export const sendMessage = async (userId, content) => {
    const response = await API.post(`/users/messages/${userId}`, { content });
    return response.data;
};

export const translateMessage = async (text, targetLanguageCode) => {
    const response = await API.post('/users/messages/translate', { text, targetLanguageCode });
    return response.data;
};
