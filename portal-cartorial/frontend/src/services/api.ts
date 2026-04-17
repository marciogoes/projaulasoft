/**
 * api.ts — Cliente HTTP Axios com interceptors
 * C3 Component: Services (camada de comunicação com a API Backend)
 */
import axios, { AxiosInstance } from 'axios';
import { getSession, signOut } from 'next-auth/react';

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: injeta o JWT em toda requisição ──────────────────
apiClient.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: trata 401 → faz logout ─────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;

    if (response?.status === 401) {
      await signOut({ callbackUrl: '/auth/login' });
    }

    const message =
      response?.data?.message ??
      response?.data?.error ??
      error.message ??
      'Erro inesperado';

    return Promise.reject(new Error(Array.isArray(message) ? message.join(', ') : message));
  },
);

export { apiClient };

// ── Funções de API por domínio ────────────────────────────────────────────
export const requestsApi = {
  findAll: (page = 1, limit = 10) =>
    apiClient.get('/api/v1/requests', { params: { page, limit } }),

  findOne: (id: string) =>
    apiClient.get(`/api/v1/requests/${id}`),

  create: (data: { documentType: string; notes?: string; metadata?: Record<string, any> }) =>
    apiClient.post('/api/v1/requests', data),

  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/api/v1/requests/${id}/status`, { status }),
};

export const documentsApi = {
  findAll: () => apiClient.get('/api/v1/documents'),
  findOne: (type: string) => apiClient.get(`/api/v1/documents/${type}`),
};

export const usersApi = {
  getMe:   () => apiClient.get('/api/v1/users/me'),
  updateMe: (data: any) => apiClient.patch('/api/v1/users/me', data),
};
