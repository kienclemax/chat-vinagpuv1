import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: {
    email: string
    username: string
    password: string
    firstName?: string
    lastName?: string
  }) => api.post('/auth/register', data),
  validateToken: () => api.post('/auth/validate'),
  getProfile: () => api.get('/auth/profile'),
}

// Users API
export const usersApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: any) => api.patch('/users/me', data),
}

// Conversations API
export const conversationsApi = {
  getAll: () => api.get('/conversations'),
  getById: (id: string) => api.get(`/conversations/${id}`),
  create: (data: { title: string }) => api.post('/conversations', data),
  update: (id: string, data: { title: string }) =>
    api.patch(`/conversations/${id}`, data),
  delete: (id: string) => api.delete(`/conversations/${id}`),
  generateTitle: (id: string) => api.post(`/conversations/${id}/generate-title`),
}

// Messages API
export const messagesApi = {
  getByConversation: (conversationId: string) =>
    api.get(`/messages/conversation/${conversationId}`),
  create: (data: {
    content: string
    role: 'USER' | 'ASSISTANT' | 'SYSTEM'
    conversationId: string
  }) => api.post('/messages', data),
  delete: (id: string) => api.delete(`/messages/${id}`),
  generateAIResponse: (conversationId: string) =>
    api.post(`/messages/conversation/${conversationId}/ai-response`),
}

export default api
