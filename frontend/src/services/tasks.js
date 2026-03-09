import api from './api';

export const taskService = {
  // Get all tasks with optional filters
  getAll: async (params = {}) => {
    const response = await api.get('/tasks', { params });
    return response.tasks || response;
  },

  // Get single task by ID
  getById: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.task || response;
  },

  // Create new task
  create: async (data) => {
    const response = await api.post('/tasks', data);
    return response.task || response;
  },

  // Update task
  update: async (id, data) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.task || response;
  },

  // Delete task
  delete: async (id) => {
    return await api.delete(`/tasks/${id}`);
  },

  // Update task status
  updateStatus: async (id, status, progress) => {
    const response = await api.patch(`/tasks/${id}/status`, { status, progress });
    return response.task || response;
  },

  // Add comment to task
  addComment: async (id, text) => {
    const response = await api.post(`/tasks/${id}/comments`, { text });
    return response.comments || response;
  },

  // Get task statistics
  getStats: async () => {
    const response = await api.get('/tasks/stats');
    return response;
  }
};