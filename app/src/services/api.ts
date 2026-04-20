import axios, { type AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    jobTitle?: string;
    department?: string;
  }) => api.post('/auth/register', data),
  
  getMe: () => api.get('/auth/me'),
  
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    jobTitle?: string;
    department?: string;
    bio?: string;
    avatarUrl?: string;
  }) => api.put('/auth/profile', data),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/password', { currentPassword, newPassword })
};

// Questions API
export const questionsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    tag?: string;
    status?: string;
    sortBy?: string;
    author?: string;
  }) => api.get('/questions', { params }),
  
  getById: (id: string) => api.get(`/questions/${id}`),
  
  create: (data: { title: string; content: string; tags?: string[] }) =>
    api.post('/questions', data),
  
  update: (id: string, data: { title?: string; content?: string; tags?: string[] }) =>
    api.put(`/questions/${id}`, data),
  
  delete: (id: string) => api.delete(`/questions/${id}`),
  
  vote: (id: string, voteType: number) =>
    api.post(`/questions/${id}/vote`, { voteType }),
  
  getRelated: (id: string) => api.get(`/questions/${id}/related`)
};

// Answers API
export const answersApi = {
  create: (data: { questionId: string; content: string }) =>
    api.post('/answers', data),
  
  update: (id: string, content: string) =>
    api.put(`/answers/${id}`, { content }),
  
  delete: (id: string) => api.delete(`/answers/${id}`),
  
  vote: (id: string, voteType: number) =>
    api.post(`/answers/${id}/vote`, { voteType }),
  
  accept: (id: string) => api.post(`/answers/${id}/accept`)
};

// Experts API
export const expertsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    tag?: string;
    minReputation?: number;
    sortBy?: string;
  }) => api.get('/experts', { params }),
  
  getById: (id: string) => api.get(`/experts/${id}`),
  
  getTags: (params?: { search?: string; category?: string }) =>
    api.get('/experts/tags/all', { params }),
  
  match: (data: { questionId: string; tagIds: string[] }) =>
    api.post('/experts/match', data),
  
  request: (data: { questionId: string; expertIds: string[]; reason?: string }) =>
    api.post('/experts/request', data)
};

// Leaderboard API
export const leaderboardApi = {
  getAll: (params?: {
    timeframe?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) => api.get('/leaderboard', { params }),
  
  getMyRank: () => api.get('/leaderboard/my-rank'),
  
  getBadges: (params?: { page?: number; limit?: number }) =>
    api.get('/leaderboard/badges', { params }),
  
  getDepartments: () => api.get('/leaderboard/departments')
};

// Quiz API
export const quizApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    difficulty?: string;
    category?: string;
    search?: string;
  }) => api.get('/quizzes', { params }),
  
  getById: (id: string) => api.get(`/quizzes/${id}`),
  
  start: (id: string) => api.post(`/quizzes/${id}/start`),
  
  submit: (id: string, data: {
    attemptId: string;
    answers: { questionId: string; answer: string }[];
    timeTakenSeconds: number;
  }) => api.post(`/quizzes/${id}/submit`, data),
  
  getDaily: () => api.get('/quizzes/daily/today'),
  
  getHistory: (params?: { page?: number; limit?: number }) =>
    api.get('/quizzes/history/my', { params })
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get('/notifications', { params }),
  
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  
  markAllAsRead: () => api.put('/notifications/read-all'),
  
  delete: (id: string) => api.delete(`/notifications/${id}`),
  
  getPreferences: () => api.get('/notifications/preferences')
};

// Admin API
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  
  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => api.get('/admin/users', { params }),
  
  updateUserStatus: (id: string, data: { isActive?: boolean; isAdmin?: boolean }) =>
    api.put(`/admin/users/${id}/status`, data),
  
  getModerationQueue: (params?: { type?: string; page?: number; limit?: number }) =>
    api.get('/admin/moderation', { params }),
  
  createTag: (data: { name: string; description?: string; category?: string }) =>
    api.post('/admin/tags', data),
  
  getSettings: () => api.get('/admin/settings')
};

// AI API
export const aiApi = {
  extractTags: (title: string, content: string) =>
  api.post('/ai/extract-tags', { title, content }),
  
  findExperts: (questionId: string, tagIds: string[], questionContent?: string) =>
    api.post('/ai/find-experts', { questionId, tagIds, questionContent }),
  
  suggestAnswer: (questionTitle: string, questionContent: string) =>
    api.post('/ai/suggest-answer', { questionTitle, questionContent }),
  
  findSimilarQuestions: (title: string, content?: string, excludeId?: string) =>
    api.post('/ai/similar-questions', { title, content, excludeId }),
  
  generateQuiz: (topic: string, difficulty?: string, questionCount?: number) =>
    api.post('/ai/generate-quiz', { topic, difficulty, questionCount }),
  
  chat: (message: string, context?: any) =>
    api.post('/ai/chat', { message, context })
};

// User API
export const userApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    expertise?: string;
  }) => api.get('/users', { params }),
  
  getById: (id: string) => api.get(`/users/${id}`),
  
  updateExpertise: (expertise: { tagId: string; level: number }[]) =>
    api.put('/users/expertise', { expertise }),
  
  getStats: (id: string) => api.get(`/users/${id}/stats`)
};

export default api;
