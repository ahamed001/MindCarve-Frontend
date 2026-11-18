import axios from 'axios';

/**
 * The only HTTP client in the app. Redux thunks call these methods; components never do.
 * Authentication uses an HttpOnly cookie, so no token is ever stored in JavaScript.
 */
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

let unauthorizedHandler = null;
export const setUnauthorizedHandler = (fn) => {
  unauthorizedHandler = fn;
};

const normaliseError = (error) => {
  const status = error.response?.status ?? 0;
  const body = error.response?.data;
  const message =
    body?.message ||
    (status === 0 ? 'Unable to reach the server. Check your connection and try again.' : 'Something went wrong. Please try again.');
  return { status, message, errors: body?.errors || [] };
};

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Blob requests receive their JSON error body as a Blob; decode it so the message is not lost.
    if (error.response?.data instanceof Blob && error.response.data.type?.includes('json')) {
      try {
        error.response.data = JSON.parse(await error.response.data.text());
      } catch {
        /* keep generic message */
      }
    }
    const normalised = normaliseError(error);
    const url = error.config?.url || '';
    if (normalised.status === 401 && unauthorizedHandler && !url.startsWith('/auth/')) unauthorizedHandler();
    return Promise.reject(normalised);
  },
);

const unwrap = (promise) => promise.then((res) => res.data);

export const NetworkService = {
  get: (url, params) => unwrap(client.get(url, { params })),
  post: (url, body) => unwrap(client.post(url, body)),
  put: (url, body) => unwrap(client.put(url, body)),
  patch: (url, body) => unwrap(client.patch(url, body)),
  del: (url) => unwrap(client.delete(url)),
  /** Binary download (reports). Returns { blob, fileName }. */
  getBlob: async (url) => {
    const res = await client.get(url, { responseType: 'blob' });
    const disposition = res.headers['content-disposition'] || '';
    const fileName = /filename="?([^"]+)"?/.exec(disposition)?.[1] || 'download';
    return { blob: res.data, fileName };
  },
};
