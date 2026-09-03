const { userModel } = require("../models");
const { parseSignupDto } = require("../dto/signup.dto");

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

function signup(req, res) {
  const parsed = parseSignupDto(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  const { data } = parsed;
  if (userModel.findByLoginId(data.loginId)) {
    return res.status(409).json({ error: "loginId already exists" });
  }
  if (userModel.findByEmail(data.email)) {
    return res.status(409).json({ error: "email already exists" });
  }

  const user = userModel.create(data);
  return res.status(201).json({
    user: userModel.toPublic(user),
  });
}

module.exports = {
  login,
  signup,
};
