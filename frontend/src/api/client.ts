import axios, { AxiosError } from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// Axios Client
//
// Design decisions:
//   1. Single instance — all requests share the same base URL, headers, and
//      interceptors. Never import axios directly anywhere else.
//   2. `withCredentials: true` — refresh tokens are sent as HttpOnly cookies.
//   3. Request interceptor — attaches the current access token from memory.
//      The token is held in memory (not localStorage) to mitigate XSS risks.
//   4. Response interceptor — handles 401 Unauthorized by calling /auth/refresh
//      once. If that also fails, it dispatches a custom DOM event that the
//      AuthContext listens to, triggering a global logout. This avoids circular
//      imports between the client and the auth context.
//   5. Queued retry logic — if multiple requests fail with 401 simultaneously
//      (race condition during token expiry), only one refresh call is made and
//      all pending requests are replayed with the new token.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env['VITE_API_URL'] ?? 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

// ── In-memory access token store ─────────────────────────────────────────────
// Stored in module closure (not window/localStorage) to prevent XSS exfiltration.

let _accessToken: string | null = null;
let _isRefreshing = false;
let _pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

export const setAccessToken = (token: string | null) => {
  _accessToken = token;
};

export const getAccessToken = (): string | null => _accessToken;

const processPendingQueue = (token: string | null, error: unknown = null) => {
  _pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  _pendingQueue = [];
};

// ── Request interceptor — attach bearer token ─────────────────────────────────

apiClient.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers['Authorization'] = `Bearer ${_accessToken}`;
  }
  return config;
});

// ── Response interceptor — silent refresh on 401 ──────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest?.['_retry']) {
      if (_isRefreshing) {
        // Queue this request until the ongoing refresh completes
        return new Promise((resolve, reject) => {
          _pendingQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest) {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return apiClient(originalRequest);
          }
        });
      }

      if (originalRequest) originalRequest['_retry'] = true;
      _isRefreshing = true;

      try {
        const { data } = await axios.post<{ data: { accessToken: string } }>(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const newToken = data.data.accessToken;
        setAccessToken(newToken);
        processPendingQueue(newToken);
        if (originalRequest) {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processPendingQueue(null, refreshError);
        setAccessToken(null);
        // Notify AuthContext to clear user state and redirect to login
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
