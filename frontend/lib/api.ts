import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/lib/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send HttpOnly cookies automatically where supported
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach Bearer token (essential for iOS Safari / WebKit ITP)
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const state = useAuthStore.getState();
    const token = state.accessToken || state.user?.access_token;
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Track if we're already refreshing to avoid loops
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: AxiosError | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(undefined);
  });
  failedQueue = [];
}

// Response interceptor — handle 401 → try refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const state = useAuthStore.getState();
        const refreshToken = state.refreshToken || state.user?.refresh_token;
        const refreshResponse = await api.post('/auth/refresh', {
          refresh_token: refreshToken,
        });

        const newAccessToken = refreshResponse.data?.access_token;
        const newRefreshToken = refreshResponse.data?.refresh_token;
        if (newAccessToken) {
          useAuthStore.getState().setTokens(newAccessToken, newRefreshToken || refreshToken || null);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        useAuthStore.getState().logout();
        // Redirect to login on session expiry
        if (typeof window !== 'undefined') {
          window.location.replace('/login');
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ---- Auth ----
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => {
    const state = useAuthStore.getState();
    const refreshToken = state.refreshToken || state.user?.refresh_token;
    return api.post('/auth/logout', { refresh_token: refreshToken });
  },
  me: () => api.get('/auth/me'),
  refresh: (refreshToken?: string) => {
    const token = refreshToken || useAuthStore.getState().refreshToken || useAuthStore.getState().user?.refresh_token;
    return api.post('/auth/refresh', { refresh_token: token });
  },
};

// ---- Teams ----
export const teamsApi = {
  list: (params?: { search?: string; skip?: number; limit?: number }) =>
    api.get('/teams', { params }),
  get: (teamId: string) => api.get(`/teams/${teamId}`),
};

// ---- Scores (Judge) ----
export const scoresApi = {
  submit: (payload: {
    team_id: string;
    round: 1 | 2;
    qa_score: number;
    innovation_score: number;
    execution_score: number;
  }) => api.post('/scores', payload),
  my: () => api.get('/scores/my'),
  teamStatus: (teamId: string) => api.get(`/scores/team/${teamId}/status`),
  teamRound: (teamId: string, round: 1 | 2) =>
    api.get(`/scores/team/${teamId}/round/${round}`),
};

// ---- Admin ----
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  leaderboard: () => api.get('/admin/leaderboard'),

  // Teams
  createTeam: (data: { team_id: string; team_name: string; leader_name: string }) =>
    api.post('/admin/teams', data),
  listTeams: (params?: { search?: string; skip?: number; limit?: number }) =>
    api.get('/admin/teams', { params }),
  teamDetail: (teamId: string) => api.get(`/admin/teams/${teamId}`),

  // Judges
  listJudges: () => api.get('/admin/judges'),
  createJudge: (data: { name: string; email: string; password: string }) =>
    api.post('/admin/judges', data),
  updateJudgeStatus: (judgeId: string, isActive: boolean) =>
    api.patch(`/admin/judges/${judgeId}/status`, { is_active: isActive }),
  resetJudgePassword: (judgeId: string, newPassword: string) =>
    api.post(`/admin/judges/${judgeId}/reset-password`, { new_password: newPassword }),
};
