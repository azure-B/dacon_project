const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

function readString(name, fallback = "") {
  const value = process.env[name];
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

function readFlag(name, fallback = false) {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

const PERIODS = Object.freeze({
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
});

const aiConfig = {
  openai: {
    apiKey: readString("OPENAI_API_KEY") || readString("AI_API_KEY"),
    baseUrl: (readString("OPENAI_BASE_URL", "https://api.openai.com/v1") || "").replace(
      /\/$/,
      ""
    ),
    model: readString("OPENAI_MODEL", "gpt-4o-mini") || "gpt-4o-mini",
  },
  gemini: {
    apiKey: readString("GEMINI_API_KEY"),
    model: readString("GEMINI_MODEL", "gemini-2.0-flash") || "gemini-2.0-flash",
  },
  required: readFlag("AI_REQUIRED", false),
  timeoutMs: Number(readString("AI_TIMEOUT_MS", "25000")) || 25000,
  evaluation: {
    timezone: readString("EVALUATION_TZ", "Asia/Seoul") || "Asia/Seoul",
    schedulerEnabled: readFlag("EVALUATION_SCHEDULER_ENABLED", true),
    cron: {
      // 매일 24시(자정 00:00)
      daily: readString("EVALUATION_CRON_DAILY", "0 0 * * *") || "0 0 * * *",
      // 일요일 24시 = 월요일 00:00
      weekly: readString("EVALUATION_CRON_WEEKLY", "0 0 * * 1") || "0 0 * * 1",
      // 말일 24시 = 익월 1일 00:00
      monthly: readString("EVALUATION_CRON_MONTHLY", "0 0 1 * *") || "0 0 1 * *",
    },
  },
  periods: PERIODS,
};

function getPreferredApiKey() {
  return aiConfig.openai.apiKey || aiConfig.gemini.apiKey || "";
}

function hasRemoteAi() {
  return Boolean(getPreferredApiKey());
}

function getPublicAiStatus() {
  return {
    openaiConfigured: Boolean(aiConfig.openai.apiKey),
    geminiConfigured: Boolean(aiConfig.gemini.apiKey),
    openaiModel: aiConfig.openai.model,
    geminiModel: aiConfig.gemini.model,
    required: aiConfig.required,
    timezone: aiConfig.evaluation.timezone,
    schedulerEnabled: aiConfig.evaluation.schedulerEnabled,
    cron: { ...aiConfig.evaluation.cron },
  };
}

module.exports = {
  aiConfig,
  PERIODS,
  getPreferredApiKey,
  hasRemoteAi,
  getPublicAiStatus,
};
