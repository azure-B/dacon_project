const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");

function loadEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    const text = fs.readFileSync(filePath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined || process.env[key] === "") {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore
  }
}

function isPlaceholderSecret(value) {
  const v = String(value || "").trim();
  if (!v) return true;
  return /YOUR_|CHANGE_ME|example|placeholder/i.test(v);
}

/** config/.env 우선, 없으면 txt 폴백 */
function loadProjectEnv() {
  loadEnvFile(path.join(ROOT, "config", ".env"));
  loadEnvFile(path.join(ROOT, "back", ".env"));
  loadEnvFile(path.join(ROOT, "config", "supabase.txt"));

  // OpenAI: .env 가 placeholder 이면 config/config.txt 첫 줄 사용
  if (isPlaceholderSecret(process.env.OPENAI_API_KEY) && isPlaceholderSecret(process.env.AI_API_KEY)) {
    try {
      const keyPath = path.join(ROOT, "config", "config.txt");
      if (fs.existsSync(keyPath)) {
        const key = fs.readFileSync(keyPath, "utf8").split(/\r?\n/)[0].trim();
        if (key && !isPlaceholderSecret(key)) process.env.OPENAI_API_KEY = key;
      }
    } catch {
      // ignore
    }
  }
}

function readString(name, fallback = "") {
  const value = process.env[name];
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

loadProjectEnv();

const supabaseConfig = {
  url: readString("SUPABASE_URL"),
  anonKey: readString("SUPABASE_ANON_KEY"),
  serviceRoleKey: readString("SUPABASE_SERVICE_ROLE_KEY"),
  dbUrl: readString("SUPABASE_DB_URL"),
};

function assertSupabaseConfigured() {
  if (!supabaseConfig.url) {
    const error = new Error("SUPABASE_URL is not configured");
    error.code = "SUPABASE_NOT_CONFIGURED";
    throw error;
  }
  if (!supabaseConfig.anonKey && !supabaseConfig.serviceRoleKey) {
    const error = new Error("SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY is required");
    error.code = "SUPABASE_NOT_CONFIGURED";
    throw error;
  }
}

function getPublicSupabaseStatus() {
  return {
    configured: Boolean(supabaseConfig.url && (supabaseConfig.anonKey || supabaseConfig.serviceRoleKey)),
    hasAnonKey: Boolean(supabaseConfig.anonKey),
    hasServiceRoleKey: Boolean(supabaseConfig.serviceRoleKey),
    hasDbUrl: Boolean(supabaseConfig.dbUrl),
  };
}

module.exports = {
  loadProjectEnv,
  supabaseConfig,
  assertSupabaseConfigured,
  getPublicSupabaseStatus,
};
