const { aiConfig, PERIODS, getPreferredApiKey } = require("../config");
const { completeJson } = require("../services/aiClient");
const spendingModel = require("./spending.model");
const userModel = require("./user.model");

const results = new Map();

function resultKey(userId, period) {
  return `${userId}:${period}`;
}

function saveResult(userId, period, payload) {
  const record = {
    ...payload,
    savedAt: new Date().toISOString(),
  };
  results.set(resultKey(userId, period), record);
  return record;
}

function getLatest(userId, period) {
  if (period) return results.get(resultKey(userId, period)) || null;
  const found = [];
  for (const value of results.values()) {
    if (value.user?.id === userId) found.push(value);
  }
  return found.sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
}

function buildSystemPrompt(period) {
  return [
    "당신은 한국 개인 소비내역 평가 보조 분석가입니다.",
    `평가 주기: ${period} (daily=전일, weekly=직전 7일, monthly=직전 달).`,
    "법률 자문이 아닙니다. 입력된 소비내역과 이용자 재무 정보만 사용하세요.",
    "반드시 JSON만 반환하세요:",
    '{ "insight": string, "riskLevel": "low"|"medium"|"high", "comment": string, "recommendations": [ { "category": string, "title": string, "detail": string, "estimatedMonthlySaving": number } ] }',
    "과소비 카테고리와 줄일 수 있는 금액을 구체적으로 제시하세요.",
  ].join("\n");
}

function buildFallback(period, summary, finance) {
  const top = summary.topCategories[0];
  const income = finance?.monthlyIncome;
  const ratio =
    income && income > 0 ? Math.round((summary.total / income) * 1000) / 10 : null;
  let riskLevel = "low";
  if (ratio != null && ratio >= 70) riskLevel = "high";
  else if (ratio != null && ratio >= 40) riskLevel = "medium";
  if (top && top.amount >= 100000) riskLevel = riskLevel === "low" ? "medium" : riskLevel;

  const recommendations = [];
  if (top) {
    recommendations.push({
      category: top.category,
      title: `${top.category} 지출 점검`,
      detail: `${period} 기간 ${top.category}가 ${top.amount.toLocaleString("ko-KR")}원으로 가장 큽니다. 빈도·단가를 줄이면 상환 여력을 늘릴 수 있습니다.`,
      estimatedMonthlySaving: Math.round(top.amount * 0.15),
    });
  } else {
    recommendations.push({
      category: "소비",
      title: "해당 기간 소비내역이 없습니다",
      detail: "기록이 없어 절감 금액을 산출하지 못했습니다.",
      estimatedMonthlySaving: 0,
    });
  }

  return {
    insight:
      ratio != null
        ? `해당 기간 소비 ${summary.total.toLocaleString("ko-KR")}원, 월소득 대비 약 ${ratio}%입니다.`
        : `해당 기간 소비 합계는 ${summary.total.toLocaleString("ko-KR")}원입니다.`,
    riskLevel,
    comment: "통신·구독·배달 등 변동비를 먼저 줄이면 채무조정 재원을 만들기 쉽습니다.",
    recommendations,
  };
}

/**
 * 소비내역과 API key를 받아 주기별 평가를 수행한다.
 */
async function evaluateSpending({
  period,
  spending,
  apiKey,
  user = null,
  range = null,
  finance = null,
}) {
  const summary = spendingModel.summarize(spending || []);
  const fallback = buildFallback(period, summary, finance);
  const payload = {
    period,
    range,
    user: user
      ? { id: user.id, loginId: user.loginId, name: user.name }
      : null,
    summary,
    spending,
    finance: finance
      ? {
          monthlyIncome: finance.monthlyIncome,
          monthlyPayment: finance.totals?.monthlyPayment ?? null,
          totalDebt: finance.totals?.totalDebt ?? null,
        }
      : null,
  };

  let aiResult = null;
  try {
    aiResult = await completeJson(
      buildSystemPrompt(period),
      JSON.stringify({ period, range, summary, spending, finance: payload.finance }, null, 2),
      { apiKey: apiKey || getPreferredApiKey() }
    );
  } catch (error) {
    if (aiConfig.required) throw error;
    aiResult = null;
  }

  const source = aiResult?.json && typeof aiResult.json === "object" ? aiResult.json : fallback;
  const recommendations = Array.isArray(source.recommendations)
    ? source.recommendations.slice(0, 5).map((item) => ({
        category: String(item.category || "소비"),
        title: String(item.title || "지출 제안"),
        detail: String(item.detail || ""),
        estimatedMonthlySaving: Math.round(Number(item.estimatedMonthlySaving) || 0),
      }))
    : fallback.recommendations;

  return {
    ...payload,
    insight: String(source.insight || fallback.insight),
    riskLevel: ["low", "medium", "high"].includes(source.riskLevel)
      ? source.riskLevel
      : fallback.riskLevel,
    comment: String(source.comment || fallback.comment),
    recommendations,
    provider: aiResult?.provider || "fallback",
    model: aiResult?.model || null,
  };
}

async function evaluateUserPeriod(user, period, now = new Date()) {
  const range = spendingModel.getRangeForPeriod(period, now);
  const spending = spendingModel.findByUserAndRange(user.id, range);
  let finance = null;
  try {
    const debtAdjustmentModel = require("./debtAdjustment.model");
    finance = debtAdjustmentModel.buildFinanceSnapshot(user);
  } catch (_error) {
    finance = null;
  }

  const result = await evaluateSpending({
    period,
    spending,
    apiKey: getPreferredApiKey(),
    user,
    range,
    finance,
  });
  return saveResult(user.id, period, result);
}

async function runPeriodPipeline(period, now = new Date()) {
  const users = userModel.findAll();
  const reports = [];
  for (const user of users) {
    reports.push(await evaluateUserPeriod(user, period, now));
  }
  return {
    period,
    ranAt: new Date().toISOString(),
    timezone: aiConfig.evaluation.timezone,
    apiKeyConfigured: Boolean(getPreferredApiKey()),
    count: reports.length,
    reports,
  };
}

module.exports = {
  PERIODS,
  evaluateSpending,
  evaluateUserPeriod,
  runPeriodPipeline,
  getLatest,
  saveResult,
};
