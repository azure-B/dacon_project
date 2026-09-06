const { getPublicAiStatus, getPublicSupabaseStatus } = require("../config");
const { getAdminClient, hasAdminAccess } = require("../services/supabase");

async function getStatus() {
  const supabase = getPublicSupabaseStatus();
  let profilesProbe = { ok: false, admin: hasAdminAccess(), error: null, demo01: false };

  if (hasAdminAccess()) {
    try {
      const db = getAdminClient();
      const { data, error } = await db
        .from("profiles")
        .select("login_id")
        .eq("login_id", "demo01")
        .maybeSingle();
      if (error) {
        profilesProbe.error = error.message;
      } else {
        profilesProbe.ok = true;
        profilesProbe.demo01 = Boolean(data?.login_id);
      }
    } catch (error) {
      profilesProbe.error = error.message || String(error);
    }
  } else {
    profilesProbe.error = "service_role key missing or not recognized";
  }

  return {
    ok: true,
    message: "서버가 정상적으로 동작 중입니다.",
    ai: getPublicAiStatus(),
    supabase: {
      ...supabase,
      profilesProbe,
    },
  };
}

module.exports = {
  getStatus,
};
