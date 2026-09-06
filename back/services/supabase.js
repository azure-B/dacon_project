const { createClient } = require("@supabase/supabase-js");
const {
  supabaseConfig,
  assertSupabaseConfigured,
} = require("../config/supabaseConfig");

let adminClient = null;
let anonClient = null;

function decodeJwtPayload(token) {
  try {
    const part = String(token || "").split(".")[1];
    if (!part) return null;
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function isServiceRoleKey(key) {
  if (!key) return false;
  const value = String(key).trim();
  // 새 API 키: secret 만 service_role. publishable/anon 은 관리자 아님
  if (value.startsWith("sb_secret_")) return true;
  if (value.startsWith("sb_publishable_")) return false;
  const payload = decodeJwtPayload(value);
  return payload?.role === "service_role";
}

function createSupabaseClient(key, options = {}) {
  assertSupabaseConfigured();
  if (!key) {
    const error = new Error("supabase api key missing");
    error.code = "SUPABASE_NOT_CONFIGURED";
    throw error;
  }
  return createClient(supabaseConfig.url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    ...options,
  });
}

function hasAdminAccess() {
  return isServiceRoleKey(supabaseConfig.serviceRoleKey);
}

/** RLS 우회 — service_role 있을 때만 */
function getAdminClient() {
  if (adminClient) return adminClient;
  if (!hasAdminAccess()) {
    const error = new Error(
      "SUPABASE_SERVICE_ROLE_KEY must be the service_role secret (not anon/publishable)"
    );
    error.code = "SUPABASE_NOT_CONFIGURED";
    throw error;
  }
  adminClient = createSupabaseClient(supabaseConfig.serviceRoleKey);
  return adminClient;
}

/** Auth signUp / signIn 용 (anon 우선) */
function getAuthClient() {
  if (anonClient) return anonClient;
  const key = supabaseConfig.anonKey || supabaseConfig.serviceRoleKey;
  anonClient = createSupabaseClient(key);
  return anonClient;
}

function getUserScopedClient(accessToken) {
  const key = supabaseConfig.anonKey || supabaseConfig.serviceRoleKey;
  return createSupabaseClient(key, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  });
}

/** service_role 있으면 admin, 없으면 유저 토큰 클라이언트 */
function getDataClient(accessToken) {
  if (hasAdminAccess()) return getAdminClient();
  if (!accessToken) {
    const error = new Error(
      "SUPABASE_SERVICE_ROLE_KEY missing — user access token required"
    );
    error.code = "SUPABASE_NOT_CONFIGURED";
    throw error;
  }
  return getUserScopedClient(accessToken);
}

module.exports = {
  getAdminClient,
  getAuthClient,
  getUserScopedClient,
  getDataClient,
  isServiceRoleKey,
  hasAdminAccess,
};
