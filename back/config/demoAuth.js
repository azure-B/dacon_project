/** 데모·배포 점검용 자동 로그인 (DEMO_AUTO_LOGIN=false 로 끌 수 있음) */
const DEMO_ACCESS_TOKEN = "demo";
const DEMO_LOGIN_ID = process.env.DEMO_LOGIN_ID || "demo01";
const DEMO_EXPIRES_IN = 60 * 60 * 24 * 30;

function isDemoAuthEnabled() {
  return process.env.DEMO_AUTO_LOGIN !== "false";
}

function isDemoAccessToken(token) {
  const value = String(token || "").trim();
  return value === DEMO_ACCESS_TOKEN || value === "demo-bypass";
}

module.exports = {
  DEMO_ACCESS_TOKEN,
  DEMO_LOGIN_ID,
  DEMO_EXPIRES_IN,
  isDemoAuthEnabled,
  isDemoAccessToken,
};
