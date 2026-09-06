// Node < 22: supabase-js가 REST 호출에도 native WebSocket을 요구함 → 로그인/DB 전부 실패
// 로그인에 웹소켓이 필요한 게 아니라, 라이브러리 제약이라 앱 기동 시 폴리필한다.
if (typeof globalThis.WebSocket === "undefined") {
  try {
    // eslint-disable-next-line global-require
    globalThis.WebSocket = require("ws");
  } catch {
    // ws 미설치 시 createClient 단계에서 다시 안내
  }
}

require("./config/supabaseConfig").loadProjectEnv();
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const { aiConfig } = require("./config");
const scheduler = require("./scheduler");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";
const frontDir = path.join(__dirname, "..", "front");
const frontIndex = path.join(frontDir, "index.html");
const apiOnly =
  process.env.API_ONLY === "true" ||
  process.env.API_ONLY === "1" ||
  !fs.existsSync(frontIndex);

const corsOrigin = process.env.CORS_ORIGIN || true;
app.set("trust proxy", 1);
app.use(
  cors({
    origin: corsOrigin === "true" ? true : corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", routes);

if (!apiOnly) {
  app.use(express.static(frontDir));
  app.get("*", (req, res) => {
    res.sendFile(frontIndex);
  });
} else {
  app.get("/", (_req, res) => {
    res.json({ ok: true, service: "dacon-api" });
  });
}

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT} (apiOnly=${apiOnly}, node=${process.version})`);
  if (aiConfig.evaluation.schedulerEnabled) {
    scheduler.start();
  }
});
