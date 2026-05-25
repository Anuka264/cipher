import API from './api';

export const consultOracle = async (userQuery) => {
    const response = await API.post('/oracle/consult', { userQuery });
    return response.data;
};