const { userModel } = require("../models");

function readBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  const [scheme, token] = String(header).split(" ");
  if (!token || String(scheme).toLowerCase() !== "bearer") return "";
  return token.trim();
}

async function requireAuth(req, res, next) {
  const token = readBearerToken(req);
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
