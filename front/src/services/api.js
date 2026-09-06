import { getAccessToken } from './authStorage';

/** 로컬: Vite 프록시 `/api` · 배포: Netlify env `VITE_API_BASE` (예: https://xxx.onrender.com/api) */
const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

export async function request(endpoint, options = {}) {
  const { headers: customHeaders, ...rest } = options;
  const token = getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...rest,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(
      errorBody.message || errorBody.error || `Request failed: ${response.status}`
    );
    error.status = response.status;
    error.code = errorBody.error || errorBody.message || '';
    throw error;
  }

  return response.json();
}

export const api = {
  login: (data) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  signup: (data) =>
    request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  analyzeDebt: (body = {}) =>
    request('/debt-adjustment', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getAccountBook: (params = {}) => request(`/account-book${toQuery(params)}`),
  getAccountBookSummary: (params = {}) => request(`/account-book/summary${toQuery(params)}`),
  getAccountBookCategorySummary: (params = {}) =>
    request(`/account-book/category-summary${toQuery(params)}`),
  createAccountBook: (data) =>
    request('/account-book', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAccountBook: (id, data) =>
    request(`/account-book/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteAccountBook: (id) =>
    request(`/account-book/${id}`, {
      method: 'DELETE',
    }),
  runSimulation: (data) =>
    request('/simulation', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  runSpendingEvaluation: (data = { period: 'monthly' }) =>
    request('/spending-evaluations/run', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getSpendingEvaluations: (params = {}) =>
    request(`/spending-evaluations${toQuery(params)}`),
};

function toQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.set(key, String(value));
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}
