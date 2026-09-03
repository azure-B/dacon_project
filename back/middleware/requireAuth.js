const { userModel } = require("../models");

function readBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  const [scheme, token] = String(header).split(" ");
  if (!token || String(scheme).toLowerCase() !== "bearer") return "";
  return token.trim();
}

function requireAuth(req, res, next) {
  const token = readBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const user = userModel.verifyAccessToken(token);
  if (!user) {
    return res.status(401).json({ error: "invalid token" });
  }

  req.user = user;
  req.accessToken = token;
  return next();
}

module.exports = {
  requireAuth,
  readBearerToken,
};
