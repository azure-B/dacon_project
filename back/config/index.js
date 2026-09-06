const {
  aiConfig,
  PERIODS,
  getPreferredApiKey,
  hasRemoteAi,
  getPublicAiStatus,
} = require("./aiConfig");
const {
  supabaseConfig,
  getPublicSupabaseStatus,
  assertSupabaseConfigured,
} = require("./supabaseConfig");

module.exports = {
  aiConfig,
  PERIODS,
  getPreferredApiKey,
  hasRemoteAi,
  getPublicAiStatus,
  supabaseConfig,
  getPublicSupabaseStatus,
  assertSupabaseConfigured,
};
