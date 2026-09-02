const { userModel } = require("../models");

function readLoginId(body) {
  const raw = body?.loginId ?? body?.userId;
  if (raw === undefined || raw === null) return "";
  return String(raw).trim();
}

function login(req, res) {
  const loginId = readLoginId(req.body);
  const password =
    req.body?.password === undefined || req.body?.password === null
      ? ""
      : String(req.body.password);

  if (!loginId) {
    return res.status(400).json({ error: "loginId is required" });
  }
  if (!password) {
    return res.status(400).json({ error: "password is required" });
  }

  const ip = req.ip;
  if (userModel.isLoginBlocked(ip, loginId)) {
    return res.status(429).json({ error: "too many login attempts" });
  }

  const user = userModel.authenticate(loginId, password);
  if (!user) {
    userModel.recordLoginFailure(ip, loginId);
    return res.status(401).json({ error: "invalid credentials" });
  }

  userModel.clearLoginFailures(ip, loginId);
  const token = userModel.createAccessToken(user);

  res.json({
    ...token,
    user: userModel.toPublic(user),
  });
}

module.exports = {
  login,
};
