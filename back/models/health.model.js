const { getPublicAiStatus, getPublicSupabaseStatus } = require("../config");

function getStatus() {
  return {
    ok: true,
    message: "서버가 정상적으로 동작 중입니다.",
    ai: getPublicAiStatus(),
    supabase: getPublicSupabaseStatus(),
  };
}

module.exports = {
  getStatus,
};
