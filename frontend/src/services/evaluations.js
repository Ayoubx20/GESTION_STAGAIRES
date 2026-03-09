import api from './api';

export const evaluationService = {
  getInternEvaluations: (internId) => api.get(`/evaluations/intern/${internId}`),
  create: (data) => api.post('/evaluations', data),
  update: (id, data) => api.put(`/evaluations/${id}`, data)
};
