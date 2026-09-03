const crypto = require("crypto");

const ACCESS_TOKEN_TTL_SEC = 3600;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-me";

let nextId = 2;
const users = [];
const sessions = new Map();
const loginAttempts = new Map();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const DUMMY_PASSWORD_HASH = hashPassword("dummy-password-for-timing");

function verifyPassword(password, passwordHash) {
  const [salt, storedHash] = String(passwordHash || "").split(":");
  if (!salt || !storedHash) return false;

  const derived = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(storedHash, "hex");
  if (derived.length !== stored.length) return false;
  return crypto.timingSafeEqual(derived, stored);
}

function authenticate(loginId, password) {
  const user = findByLoginId(loginId);
  const passwordOk = verifyPassword(
    password,
    user ? user.passwordHash : DUMMY_PASSWORD_HASH
  );
  if (!user || !passwordOk) return null;
  return user;
}

function financeFields(user) {
  return {
    monthlyIncome: user.monthlyIncome ?? null,
    targetAmount: user.targetAmount ?? null,
    targetPeriod: user.targetPeriod ?? null,
    assetList: Array.isArray(user.assetList) ? user.assetList.slice() : [],
    loanList: Array.isArray(user.loanList) ? user.loanList.slice() : [],
    productIds: Array.isArray(user.productIds) ? user.productIds.slice() : [],
  };
}

function toPublic(user) {
  return {
    id: user.id,
    loginId: user.loginId,
    email: user.email,
    name: user.name,
    createdAt: String(user.createdAt).slice(0, 10),
    ...financeFields(user),
  };
}

function findByLoginId(loginId) {
  return users.find((user) => user.loginId === loginId) || null;
}

function findByEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return null;
  return (
    users.find((user) => String(user.email).trim().toLowerCase() === normalized) ||
    null
  );
}

function findById(id) {
  return users.find((user) => user.id === id) || null;
}

function create(data) {
  const user = {
    id: nextId++,
    loginId: data.loginId,
    email: data.email,
    name: data.name,
    passwordHash: hashPassword(data.password),
    monthlyIncome: data.monthlyIncome ?? null,
    targetAmount: data.targetAmount ?? null,
    targetPeriod: data.targetPeriod ?? null,
    assetList: Array.isArray(data.assetList) ? data.assetList.slice() : [],
    loanList: Array.isArray(data.loanList) ? data.loanList.slice() : [],
    productIds: Array.isArray(data.productIds) ? data.productIds.slice() : [],
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function verifyAccessToken(token) {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() >= session.expiresAt) {
    sessions.delete(token);
    return null;
  }

  const parts = String(token).split(".");
  if (parts.length !== 3) return null;

  const expected = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${parts[0]}.${parts[1]}`)
    .digest("base64url");
  const actual = parts[2];
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(actual);
  if (expectedBuf.length !== actualBuf.length) return null;
  if (!crypto.timingSafeEqual(expectedBuf, actualBuf)) return null;

  return findById(session.userId);
}

function createAccessToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      sub: user.id,
      loginId: user.loginId,
      iat: now,
      exp: now + ACCESS_TOKEN_TTL_SEC,
    })
  );
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  const accessToken = `${header}.${payload}.${signature}`;

  sessions.set(accessToken, {
    userId: user.id,
    expiresAt: (now + ACCESS_TOKEN_TTL_SEC) * 1000,
  });

  return {
    accessToken,
    tokenType: "Bearer",
    expiresIn: ACCESS_TOKEN_TTL_SEC,
  };
}

function attemptKey(ip, loginId) {
  return `${ip || "unknown"}:${loginId}`;
}

function isLoginBlocked(ip, loginId) {
  const record = loginAttempts.get(attemptKey(ip, loginId));
  if (!record) return false;
  if (Date.now() - record.firstAt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(attemptKey(ip, loginId));
    return false;
  }
  return record.count >= LOGIN_MAX_ATTEMPTS;
}

function recordLoginFailure(ip, loginId) {
  const key = attemptKey(ip, loginId);
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || now - record.firstAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAt: now });
    return;
  }

  record.count += 1;
}

function clearLoginFailures(ip, loginId) {
  loginAttempts.delete(attemptKey(ip, loginId));
}

users.push({
  id: 1,
  loginId: "user01",
  email: "user01@example.com",
  name: "홍길동",
  passwordHash: hashPassword("pass1234"),
  createdAt: "2026-08-31T00:00:00.000Z",
  monthlyIncome: 4200000,
  targetAmount: 10000000,
  targetPeriod: 24,
  assetList: [
    {
      productId: 10,
      isManual: false,
      amount: 1500000,
      상품명: "KB Star 정기예금",
    },
  ],
  loanList: [
    {
      productId: 95,
      balance: 65000000,
      monthlyPayment: 1245000,
      상품명: "OK희망대출",
      은행명: "OK저축은행",
      상품_유형: "신용대출",
      이자율_최저: 6.5,
      이자율_최고: 12,
    },
  ],
  productIds: [95, 10],
});

function findAll() {
  return users.slice();
}

module.exports = {
  ACCESS_TOKEN_TTL_SEC,
  hashPassword,
  verifyPassword,
  authenticate,
  toPublic,
  findByLoginId,
  findByEmail,
  findById,
  findAll,
  create,
  createAccessToken,
  verifyAccessToken,
  isLoginBlocked,
  recordLoginFailure,
  clearLoginFailures,
};
