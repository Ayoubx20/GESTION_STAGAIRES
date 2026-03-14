import api from './api';

export const teamService = {
  getAll: async () => {
    const response = await api.get('/teams');
    return response.teams;
  },

  getById: async (id) => {
    const response = await api.get(`/teams/${id}`);
    return response.team;
  },

  create: async (teamData) => {
    const response = await api.post('/teams', teamData);
    return response.team;
  },

  update: async (id, teamData) => {
    const response = await api.put(`/teams/${id}`, teamData);
    return response.team;
  },

  delete: async (id) => {
    const response = await api.delete(`/teams/${id}`);
    return response;
  }
};
