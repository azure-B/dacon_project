const { userModel } = require("../models");
const { hasAdminAccess } = require("../services/supabase");
const {
  DEMO_LOGIN_ID,
  isDemoAuthEnabled,
  isDemoAccessToken,
} = require("../config/demoAuth");

function readBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  const [scheme, token] = String(header).split(" ");
  if (!token || String(scheme).toLowerCase() !== "bearer") return "";
  return token.trim();
}

async function attachDemoUser(req, res, next) {
  try {
    if (!hasAdminAccess()) {
      return res.status(503).json({
        error: "demo auth failed",
        message:
          "Render SUPABASE_SERVICE_ROLE_KEY가 service_role 시크릿이 아닙니다. Dashboard → API → service_role 키를 그대로 넣어주세요.",
      });
    }

    const user = await userModel.findByLoginId(DEMO_LOGIN_ID);
    if (!user?.id) {
      return res.status(503).json({
        error: "demo user missing",
        message:
          "demo01 프로필이 없습니다. 로컬에서 seed를 실행했는지, Render SUPABASE_URL이 같은 프로젝트인지 확인하세요.",
      });
    }
    req.user = user;
    req.accessToken = "";
    return next();
  } catch (error) {
    if (error.code === "SUPABASE_NOT_CONFIGURED") {
      return res.status(503).json({ error: "supabase not configured" });
    }
    return res.status(503).json({
      error: "demo auth failed",
      message: error.message || "demo auth failed",
    });
  }
}

async function requireAuth(req, res, next) {
  const token = readBearerToken(req);

  if (isDemoAuthEnabled() && (!token || isDemoAccessToken(token))) {
    return attachDemoUser(req, res, next);
  }

  if (!token) {
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    const user = await userModel.verifyAccessToken(token);
    if (!user) {
      return res.status(401).json({ error: "invalid token" });
    }
    req.user = user;
    req.accessToken = token;
    return next();
  } catch (error) {
    if (error.code === "SUPABASE_NOT_CONFIGURED") {
      return res.status(503).json({ error: "supabase not configured" });
    }
    return res.status(401).json({ error: "invalid token" });
  }
}

module.exports = {
  requireAuth,
  readBearerToken,
};
