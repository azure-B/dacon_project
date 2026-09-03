const { aiConfig, getPreferredApiKey } = require("../config");
const { completeJson } = require("./aiClient");

const MAX_TEXT_LENGTH = 2000;

const SPAM_SIGNALS = [
  { re: /대출|대환|저금리|무이자|한도.?승인|신용.?등급|햇살론|사채/i, weight: 28 },
  { re: /클릭|바로가기|bit\.ly|tinyurl|t\.co|단축.?url/i, weight: 22 },
  { re: /https?:\/\/|www\./i, weight: 12 },
  { re: /당첨|축하|경품|무료.?쿠폰|이벤트/i, weight: 22 },
  { re: /계좌|이체|입금|송금|환급|출금/i, weight: 20 },
  { re: /인증.?번호|비밀번호|개인정보|주민등록|OTP/i, weight: 28 },
  { re: /택배|미배송|통관|관세|배송.?사고/i, weight: 22 },
  { re: /정부.?지원|긴급.?지원|재난.?지원|보조금/i, weight: 20 },
  { re: /광고|수신거부|무료수신거부/i, weight: 16 },
  { re: /피싱|스미싱|보이스.?피싱/i, weight: 40 },
  { re: /지금.?바로|오늘.?마감|선착순|한정/i, weight: 10 },
  { re: /카카오톡|텔레그램|오픈채팅/i, weight: 12 },
];

function normalizeText(value) {
  return String(value ?? "").trim();
}

function validateText(value) {
  const text = normalizeText(value);
  if (!text) {
    const error = new Error("text is required");
    error.code = "VALIDATION";
    error.status = 400;
    throw error;
  }
  if (text.length > MAX_TEXT_LENGTH) {
    const error = new Error("text is too long");
    error.code = "VALIDATION";
    error.status = 400;
    throw error;
  }
  return text;
}

function clampProbability(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function buildFallback(text) {
  let score = 8;
  const hits = [];

  for (const signal of SPAM_SIGNALS) {
    if (signal.re.test(text)) {
      score += signal.weight;
      hits.push(signal.re.source.replace(/\\/g, "").slice(0, 24));
    }
  }

  if (text.length >= 80) score += 4;
  if (/[!]{2,}|[?]{2,}/.test(text)) score += 6;
  if (/\d{10,}/.test(text.replace(/\s/g, ""))) score += 8;

  const spamProbability = clampProbability(score);
  const isSpam = spamProbability >= 50;

  const message = isSpam
    ? `문자에 대출·광고·피싱에서 자주 쓰는 표현이 포함되어 스팸 가능성이 높습니다. 링크를 누르거나 계좌·인증번호를 알려주지 마세요.${hits.length ? ` (규칙 기반 점검)` : ""}`
    : "뚜렷한 스팸 징후는 적습니다. 그래도 모르는 번호의 링크·입금 요청은 확인 후 대응하세요.";

  return {
    isSpam,
    spamProbability,
    message,
    provider: "fallback",
    model: null,
  };
}

function buildSystemPrompt() {
  return [
    "당신은 한국어 스팸·피싱·광고 문자 분류 보조입니다.",
    "입력은 이용자가 받은 SMS/문자 본문입니다.",
    "스팸 범위: 피싱, 스미싱, 광고, 대출 권유, 당첨/경품 사기, 가짜 택배·정부지원, 개인정보 탈취.",
    "반드시 JSON만 반환하세요.",
    '{ "isSpam": boolean, "spamProbability": number, "message": string }',
    "spamProbability는 0 이상 100 이하 정수입니다.",
    "message는 한국어로 판단 이유와 이용자 주의 안내를 2~4문장으로 작성하세요.",
    "확실하지 않으면 isSpam을 false로 두고 확률을 중간값으로 두세요.",
    "법률 단정이 아니라 주의 안내입니다.",
  ].join("\n");
}

function normalizeResult(source, provider, model) {
  const fallback = typeof source?.spamProbability === "number" ? source : null;
  const spamProbability = clampProbability(source?.spamProbability);
  const isSpam =
    typeof source?.isSpam === "boolean" ? source.isSpam : spamProbability >= 50;
  const message =
    typeof source?.message === "string" && source.message.trim()
      ? source.message.trim()
      : fallback?.message || "분석 결과를 확인하세요.";

  return {
    isSpam,
    spamProbability,
    message,
    provider: provider || "fallback",
    model: model || null,
  };
}

async function analyze(rawText, options = {}) {
  const text = validateText(rawText);
  const fallback = buildFallback(text);

  let aiResult = null;
  try {
    aiResult = await completeJson(buildSystemPrompt(), JSON.stringify({ text }), {
      apiKey: options.apiKey || getPreferredApiKey(),
    });
  } catch (error) {
    if (aiConfig.required) throw error;
    aiResult = null;
  }

  if (!aiResult) {
    return fallback;
  }

  return normalizeResult(aiResult.json, aiResult.provider, aiResult.model);
}

module.exports = {
  MAX_TEXT_LENGTH,
  analyze,
  buildFallback,
  validateText,
};
