import api from './api';

export const departmentService = {
  // Get all departments
  getAll: async () => {
    const response = await api.get('/departments');
    return response.departments || response;
  },

  // Get single department by ID
  getById: async (id) => {
    const response = await api.get(`/departments/${id}`);
    return response.department || response;
  },

  // Create new department
  create: async (data) => {
    const response = await api.post('/departments', data);
    return response.department || response;
  },

  // Update department
  update: async (id, data) => {
    const response = await api.put(`/departments/${id}`, data);
    return response.department || response;
  },

  // Delete department
  delete: async (id) => {
    return await api.delete(`/departments/${id}`);
  },

  // Get department statistics
  getStats: async () => {
    const response = await api.get('/departments/stats');
    return response;
  }
};