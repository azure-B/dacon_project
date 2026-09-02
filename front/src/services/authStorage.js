const STORAGE_KEYS = {
  accessToken: 'dacon_accessToken',
  tokenType: 'dacon_tokenType',
  expiresIn: 'dacon_expiresIn',
  user: 'dacon_user',
};

export function saveAuthSession({ accessToken, tokenType, expiresIn, user }) {
  localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  localStorage.setItem(STORAGE_KEYS.tokenType, tokenType ?? 'Bearer');
  localStorage.setItem(STORAGE_KEYS.expiresIn, String(expiresIn ?? ''));
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export function getAccessToken() {
  return localStorage.getItem(STORAGE_KEYS.accessToken);
}

export function getStoredUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.user);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
