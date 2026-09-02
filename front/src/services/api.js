const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  getExamples: () => request('/examples'),
  getExample: (id) => request(`/examples/${id}`),
  createExample: (data) =>
    request('/examples', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
