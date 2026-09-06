const {
  getAdminClient,
  getAuthClient,
  getDataClient,
  getUserScopedClient,
  hasAdminAccess,
} = require("../services/supabase");

const ACCESS_TOKEN_TTL_SEC = 3600;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;

const loginAttempts = new Map();

function financeFields(row) {
  return {
    monthlyIncome: row.monthly_income == null ? null : Number(row.monthly_income),
    targetAmount: row.target_amount == null ? null : Number(row.target_amount),
    targetPeriod: row.target_period == null ? null : Number(row.target_period),
    assetList: Array.isArray(row.asset_list) ? row.asset_list.slice() : [],
    loanList: Array.isArray(row.loan_list) ? row.loan_list.slice() : [],
    productIds: Array.isArray(row.product_ids) ? row.product_ids.slice() : [],
  };
}

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    loginId: row.login_id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    passwordHash: null,
    ...financeFields(row),
  };
}

function toPublic(user) {
  return {
    id: user.id,
    loginId: user.loginId,
    email: user.email,
    name: user.name,
    createdAt: String(user.createdAt || "").slice(0, 10),
    monthlyIncome: user.monthlyIncome ?? null,
    targetAmount: user.targetAmount ?? null,
    targetPeriod: user.targetPeriod ?? null,
    assetList: Array.isArray(user.assetList) ? user.assetList.slice() : [],
    loanList: Array.isArray(user.loanList) ? user.loanList.slice() : [],
    productIds: Array.isArray(user.productIds) ? user.productIds.slice() : [],
  };
}

function profilePayload(userId, data) {
  return {
    id: userId,
    login_id: data.loginId,
    email: String(data.email || "").trim().toLowerCase(),
    name: data.name,
    monthly_income: data.monthlyIncome ?? null,
    target_amount: data.targetAmount ?? null,
    target_period: data.targetPeriod ?? null,
    asset_list: Array.isArray(data.assetList) ? data.assetList : [],
    loan_list: Array.isArray(data.loanList) ? data.loanList : [],
    product_ids: Array.isArray(data.productIds) ? data.productIds : [],
  };
}

async function findByLoginId(loginId) {
  const normalized = String(loginId || "").trim();
  if (!normalized) return null;

  if (hasAdminAccess()) {
    const db = getAdminClient();
    const { data, error } = await db
      .from("profiles")
      .select("*")
      .eq("login_id", normalized)
      .maybeSingle();
    if (error) throw error;
    return rowToUser(data);
  }

  // anon: RPC로 email만 조회 후, 프로필은 로그인 세션에서 채움
  const auth = getAuthClient();
  const { data: email, error } = await auth.rpc("email_for_login_id", {
    p_login_id: normalized,
  });
  if (error) throw error;
  if (!email) return null;
  return {
    id: null,
    loginId: normalized,
    email,
    name: normalized,
    createdAt: null,
    monthlyIncome: null,
    targetAmount: null,
    targetPeriod: null,
    assetList: [],
    loanList: [],
    productIds: [],
  };
}

async function findByEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return null;
  if (!hasAdminAccess()) {
    // 회원가입 중복은 Auth 쪽에서 최종 판정
    return null;
  }
  const db = getAdminClient();
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("email", normalized)
    .maybeSingle();
  if (error) throw error;
  return rowToUser(data);
}

async function findById(id, accessToken = "") {
  if (!id) return null;
  const db = getDataClient(accessToken);
  const { data, error } = await db.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return rowToUser(data);
}

async function findAll() {
  const db = getAdminClient();
  const { data, error } = await db.from("profiles").select("*");
  if (error) throw error;
  return (data || []).map(rowToUser);
}

async function upsertProfile(userId, data, accessToken = "") {
  const db = accessToken ? getUserScopedClient(accessToken) : getDataClient(accessToken);
  const { data: row, error } = await db
    .from("profiles")
    .upsert(profilePayload(userId, data), { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw error;
  return rowToUser(row);
}

async function create(data) {
  const auth = getAuthClient();

  if (!hasAdminAccess()) {
    const { data: taken, error: takenError } = await auth.rpc("login_id_taken", {
      p_login_id: data.loginId,
    });
    if (takenError) throw takenError;
    if (taken) {
      const err = new Error("loginId already exists");
      err.code = "LOGIN_ID_EXISTS";
      throw err;
    }
  } else if (await findByLoginId(data.loginId)) {
    const err = new Error("loginId already exists");
    err.code = "LOGIN_ID_EXISTS";
    throw err;
  }

  const { data: signedUp, error } = await auth.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        login_id: data.loginId,
        name: data.name,
      },
    },
  });
  if (error) {
    const err = new Error(error.message || "signup failed");
    err.code = error.message?.toLowerCase().includes("already")
      ? "EMAIL_EXISTS"
      : "SIGNUP_FAILED";
    err.cause = error;
    throw err;
  }
  if (!signedUp?.user?.id) {
    const err = new Error("signup failed");
    err.code = "SIGNUP_FAILED";
    throw err;
  }

  const accessToken = signedUp.session?.access_token || "";
  if (hasAdminAccess()) {
    return upsertProfile(signedUp.user.id, data);
  }
  if (!accessToken) {
    // 이메일 확인이 켜져 있으면 세션이 없음 — 트리거로 만든 스텁만 존재
    return {
      id: signedUp.user.id,
      loginId: data.loginId,
      email: data.email,
      name: data.name,
      createdAt: new Date().toISOString(),
      ...financeFields({
        monthly_income: data.monthlyIncome,
        target_amount: data.targetAmount,
        target_period: data.targetPeriod,
        asset_list: data.assetList,
        loan_list: data.loanList,
        product_ids: data.productIds,
      }),
    };
  }
  return upsertProfile(signedUp.user.id, data, accessToken);
}

async function authenticate(loginId, password) {
  try {
    let email = "";
    let stub = null;

    if (hasAdminAccess()) {
      stub = await findByLoginId(loginId);
      email = stub?.email || "";
    } else {
      const auth = getAuthClient();
      const { data, error } = await auth.rpc("email_for_login_id", {
        p_login_id: String(loginId || "").trim(),
      });
      // RPC 미배포·조회 실패는 500 대신 자격 없음으로 처리
      if (error) {
        console.error("[authenticate] email_for_login_id:", error.message || error);
        return null;
      }
      email = data || "";
    }
    if (!email) return null;

    const auth = getAuthClient();
    const { data, error } = await auth.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data?.session?.access_token) return null;

    let profile = null;
    try {
      profile = await findById(data.user.id, data.session.access_token);
    } catch (profileError) {
      console.error("[authenticate] findById:", profileError.message || profileError);
    }

    const user =
      profile ||
      stub ||
      rowToUser({
        id: data.user.id,
        login_id: loginId,
        email,
        name: loginId,
        created_at: data.user.created_at,
      });

    return {
      user,
      accessToken: data.session.access_token,
      tokenType: data.session.token_type || "Bearer",
      expiresIn: data.session.expires_in || ACCESS_TOKEN_TTL_SEC,
    };
  } catch (error) {
    if (error.code === "SUPABASE_NOT_CONFIGURED") throw error;
    console.error("[authenticate]", error.message || error);
    return null;
  }
}

async function verifyAccessToken(token) {
  if (!token) return null;
  const auth = getAuthClient();
  const { data, error } = await auth.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return findById(data.user.id, token);
}

function createAccessToken(_user) {
  throw new Error("createAccessToken is replaced by Supabase Auth session");
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

module.exports = {
  ACCESS_TOKEN_TTL_SEC,
  toPublic,
  findByLoginId,
  findByEmail,
  findById,
  findAll,
  create,
  upsertProfile,
  authenticate,
  verifyAccessToken,
  createAccessToken,
  isLoginBlocked,
  recordLoginFailure,
  clearLoginFailures,
};
