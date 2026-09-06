const { userModel } = require("../models");
const { parseSignupDto } = require("../dto/signup.dto");

function readLoginId(body) {
  const raw = body?.loginId ?? body?.userId;
  if (raw === undefined || raw === null) return "";
  return String(raw).trim();
}

async function login(req, res) {
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

  try {
    const session = await userModel.authenticate(loginId, password);
    if (!session) {
      userModel.recordLoginFailure(ip, loginId);
      return res.status(401).json({ error: "invalid credentials" });
    }

    userModel.clearLoginFailures(ip, loginId);
    return res.json({
      accessToken: session.accessToken,
      tokenType: session.tokenType,
      expiresIn: session.expiresIn,
      user: userModel.toPublic(session.user),
    });
  } catch (error) {
    if (error.code === "SUPABASE_NOT_CONFIGURED") {
      return res.status(503).json({ error: "supabase not configured" });
    }
    return res.status(500).json({ error: "login failed" });
  }
}

async function signup(req, res) {
  const parsed = parseSignupDto(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  const { data } = parsed;
  try {
    if (await userModel.findByLoginId(data.loginId)) {
      return res.status(409).json({ error: "loginId already exists" });
    }
    if (await userModel.findByEmail(data.email)) {
      return res.status(409).json({ error: "email already exists" });
    }

    const user = await userModel.create(data);
    return res.status(201).json({
      user: userModel.toPublic(user),
    });
  } catch (error) {
    if (error.code === "SUPABASE_NOT_CONFIGURED") {
      return res.status(503).json({ error: "supabase not configured" });
    }
    if (error.code === "EMAIL_EXISTS" || error.code === "LOGIN_ID_EXISTS") {
      return res.status(409).json({
        error: error.code === "LOGIN_ID_EXISTS" ? "loginId already exists" : "email already exists",
      });
    }
    return res.status(500).json({ error: "signup failed" });
  }
}

module.exports = {
  login,
  signup,
};
