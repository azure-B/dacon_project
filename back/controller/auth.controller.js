const { userModel } = require("../models");
const { parseSignupDto } = require("../dto/signup.dto");
const {
  DEMO_ACCESS_TOKEN,
  DEMO_LOGIN_ID,
  DEMO_EXPIRES_IN,
  isDemoAuthEnabled,
} = require("../config/demoAuth");

function readLoginId(body) {
  const raw = body?.loginId ?? body?.userId;
  if (raw === undefined || raw === null) return "";
  return String(raw).trim();
}

async function buildDemoSession() {
  const user =
    (await userModel.findByLoginId(DEMO_LOGIN_ID)) ||
    {
      id: "demo",
      loginId: DEMO_LOGIN_ID,
      email: `${DEMO_LOGIN_ID}@example.com`,
      name: DEMO_LOGIN_ID,
    };
  return {
    accessToken: DEMO_ACCESS_TOKEN,
    tokenType: "Bearer",
    expiresIn: DEMO_EXPIRES_IN,
    user: userModel.toPublic(user),
  };
}

async function login(req, res) {
  if (isDemoAuthEnabled()) {
    try {
      return res.json(await buildDemoSession());
    } catch (error) {
      if (error.code === "SUPABASE_NOT_CONFIGURED") {
        return res.status(503).json({ error: "supabase not configured" });
      }
      // DB 조회 실패해도 UI 진입용 데모 세션은 발급
      return res.json({
        accessToken: DEMO_ACCESS_TOKEN,
        tokenType: "Bearer",
        expiresIn: DEMO_EXPIRES_IN,
        user: {
          id: "demo",
          loginId: DEMO_LOGIN_ID,
          email: `${DEMO_LOGIN_ID}@example.com`,
          name: DEMO_LOGIN_ID,
        },
      });
    }
  }

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
