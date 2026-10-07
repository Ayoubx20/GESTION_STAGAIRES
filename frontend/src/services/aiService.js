import api from './api';

export const sendAIChatMessage = async (message, history = []) => {
  try {
    const response = await api.post('/ai/chat', { message, history });
    return response;
  } catch (error) {
    console.error('AI Service Chat Error:', error);
    throw error;
  }
};

export const getAITaskSuggestions = async (topic, difficulty) => {
  try {
    const response = await api.post('/ai/suggest-task', { topic, difficulty });
    return response.tasks || [];
  } catch (error) {
    console.error('AI Suggestion Error:', error);
    return [];
  }
};
