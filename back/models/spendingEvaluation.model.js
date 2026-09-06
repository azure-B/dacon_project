const { aiConfig, PERIODS, getPreferredApiKey } = require("../config");
const { completeJson } = require("../services/aiClient");
const { getDataClient } = require("../services/supabase");
const spendingModel = require("./spending.model");
const userModel = require("./user.model");

function buildSystemPrompt(period) {
  return `KO spend eval ${period}. JSON only. Fields: insight=한국어문장(최대80자), riskLevel=low|medium|high, comment=한국어문장(최대60자), recommendations=[{category,title,detail(최대40자),estimatedMonthlySaving,difficulty:쉬움|보통|어려움}] max3. insight/comment에 숫자만 쓰지 말 것. 법률자문금지.`;
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
      detail: `${period} 기간 ${top.category}가 ${top.amount.toLocaleString("ko-KR")}원으로 가장 큽니다.`,
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

function rowToEvaluation(row, user = null) {
  if (!row) return null;
  return {
    period: row.period,
    range:
      row.range_from || row.range_to
        ? { from: row.range_from, to: row.range_to }
        : null,
    user: user
      ? { id: user.id, loginId: user.loginId, name: user.name }
      : { id: row.user_id },
    summary: row.summary || {},
    spending: row.spending || [],
    finance: row.finance || null,
    insight: row.insight || "",
    riskLevel: row.risk_level || "low",
    comment: row.comment || "",
    recommendations: row.recommendations || [],
    provider: row.provider || null,
    model: row.model || null,
    savedAt: row.saved_at,
  };
}

async function saveResult(userId, period, payload, accessToken = "") {
  const db = getDataClient(accessToken);
  const record = {
    user_id: userId,
    period,
    range_from: payload.range?.from || null,
    range_to: payload.range?.to || null,
    summary: payload.summary || {},
    spending: payload.spending || [],
    finance: payload.finance || null,
    insight: payload.insight || "",
    risk_level: payload.riskLevel || "low",
    comment: payload.comment || "",
    recommendations: payload.recommendations || [],
    provider: payload.provider || null,
    model: payload.model || null,
    saved_at: new Date().toISOString(),
  };
  const { data, error } = await db
    .from("spending_evaluations")
    .upsert(record, { onConflict: "user_id,period" })
    .select("*")
    .single();
  if (error) throw error;
  return rowToEvaluation(data, payload.user);
}

async function getLatest(userId, period, accessToken = "") {
  const db = getDataClient(accessToken);
  if (period) {
    const { data, error } = await db
      .from("spending_evaluations")
      .select("*")
      .eq("user_id", userId)
      .eq("period", period)
      .maybeSingle();
    if (error) throw error;
    return rowToEvaluation(data);
  }
  const { data, error } = await db
    .from("spending_evaluations")
    .select("*")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => rowToEvaluation(row));
}

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
    user: user ? { id: user.id, loginId: user.loginId, name: user.name } : null,
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
    const compact = {
      period,
      total: summary.total,
      top: (summary.topCategories || []).slice(0, 3).map((c) => ({
        c: c.category,
        a: Math.round(Number(c.amount) / 10000),
      })),
      n: summary.count,
      inc: finance?.monthlyIncome != null ? Math.round(Number(finance.monthlyIncome) / 10000) : null,
    };
    aiResult = await completeJson(buildSystemPrompt(period), JSON.stringify(compact), {
      apiKey: apiKey || getPreferredApiKey(),
      maxTokens: 280,
      temperature: 0.1,
    });
  } catch (error) {
    if (aiConfig.required) throw error;
    aiResult = null;
  }

  const source = aiResult?.json && typeof aiResult.json === "object" ? aiResult.json : fallback;
  const recommendations = Array.isArray(source.recommendations)
    ? source.recommendations.slice(0, 5).map((item) => {
        const saving = Math.round(Number(item.estimatedMonthlySaving) || 0);
        let difficulty = String(item.difficulty || "").trim();
        if (!["쉬움", "보통", "어려움", "매우 쉬움"].includes(difficulty)) {
          if (saving >= 150000) difficulty = "보통";
          else if (saving >= 50000) difficulty = "쉬움";
          else difficulty = "매우 쉬움";
        }
        return {
          category: String(item.category || "소비"),
          title: String(item.title || "지출 제안"),
          detail: String(item.detail || ""),
          estimatedMonthlySaving: saving,
          difficulty,
        };
      })
    : fallback.recommendations.map((item) => ({
        ...item,
        difficulty: item.difficulty || "쉬움",
      }));

  function pickText(raw, fb, minLen = 12) {
    const text = String(raw ?? "").trim();
    if (!text) return fb;
    if (/^<=?\d+/.test(text)) return fb;
    if (/^\d+(\.\d+)?%?$/.test(text)) return fb;
    if (text.length < minLen) return fb;
    return text;
  }

  return {
    ...payload,
    insight: pickText(source.insight, fallback.insight),
    riskLevel: ["low", "medium", "high"].includes(source.riskLevel)
      ? source.riskLevel
      : fallback.riskLevel,
    comment: pickText(source.comment, fallback.comment, 8),
    recommendations,
  };
}

async function evaluateUserPeriod(user, period, now = new Date(), accessToken = "") {
  const range = spendingModel.getRangeForPeriod(period, now);
  const spending = await spendingModel.findByUserAndRange(user.id, range, accessToken);
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
  return saveResult(user.id, period, result, accessToken);
}

async function runPeriodPipeline(period, now = new Date()) {
  const users = await userModel.findAll();
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
