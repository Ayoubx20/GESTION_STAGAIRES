import api from './api';

export const internService = {
  // Get all interns with optional filters
  getAll: async (params = {}) => {
    const response = await api.get('/interns', { params });
    return response.interns || response;
  },

  // Get single intern by ID
  getById: async (id) => {
    const response = await api.get(`/interns/${id}`);
    return response.intern || response;
  },

  // Create new intern
  create: async (data) => {
    const response = await api.post('/interns', data);
    return response.intern || response;
  },

  // Update intern
  update: async (id, data) => {
    const response = await api.put(`/interns/${id}`, data);
    return response.intern || response;
  },

  // Delete intern
  delete: async (id) => {
    return await api.delete(`/interns/${id}`);
  },

  // Update intern status
  updateStatus: async (id, status) => {
    const response = await api.patch(`/interns/${id}/status`, { status });
    return response.intern || response;
  },

  // Get intern statistics
  getStats: async () => {
    const response = await api.get('/interns/stats');
    return response;
  }
};