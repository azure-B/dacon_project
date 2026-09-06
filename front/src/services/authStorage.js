const STORAGE_KEYS = {
  accessToken: 'dacon_accessToken',
  tokenType: 'dacon_tokenType',
  expiresIn: 'dacon_expiresIn',
  user: 'dacon_user',
};

const DEMO_SESSION = {
  accessToken: 'demo',
  tokenType: 'Bearer',
  expiresIn: 60 * 60 * 24 * 30,
  user: {
    id: 'demo',
    loginId: 'demo01',
    email: 'demo01@example.com',
    name: 'demo01',
  },
};

export function saveAuthSession({ accessToken, tokenType, expiresIn, user }) {
  localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  localStorage.setItem(STORAGE_KEYS.tokenType, tokenType ?? 'Bearer');
  localStorage.setItem(STORAGE_KEYS.expiresIn, String(expiresIn ?? ''));
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

/** 로그인 화면 없이 데모 세션을 즉시 넣음 */
export function ensureDemoSession() {
  saveAuthSession(DEMO_SESSION);
  return DEMO_SESSION;
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
