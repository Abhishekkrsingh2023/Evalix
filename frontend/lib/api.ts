import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send HttpOnly cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
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
        await api.post('/auth/refresh');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
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
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
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
  leaderboard: (round?: string) =>
    api.get('/admin/leaderboard', { params: round ? { round } : undefined }),

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
