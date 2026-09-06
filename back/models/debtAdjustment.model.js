const userModel = require("./user.model");
const financialProductModel = require("./financialProduct.model");

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function round(value) {
  return Math.round(toNumber(value));
}

function buildFinanceSnapshot(user) {
  const publicUser = userModel.toPublic(user);
  const loanList = publicUser.loanList || [];
  const assetList = publicUser.assetList || [];

  const totalDebt = loanList.reduce((sum, item) => sum + toNumber(item.balance), 0);
  const monthlyPayment = loanList.reduce(
    (sum, item) => sum + toNumber(item.monthlyPayment),
    0
  );
  const totalAssets = assetList.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const monthlyIncome = publicUser.monthlyIncome;
  const dsrPercent =
    monthlyIncome && monthlyIncome > 0
      ? Math.round((monthlyPayment / monthlyIncome) * 1000) / 10
      : null;

  return {
    user: {
      id: publicUser.id,
      loginId: publicUser.loginId,
      name: publicUser.name,
    },
    monthlyIncome,
    targetAmount: publicUser.targetAmount,
    targetPeriod: publicUser.targetPeriod,
    assetList,
    loanList,
    productIds: publicUser.productIds || [],
    totals: {
      totalDebt,
      totalAssets,
      monthlyPayment,
      dsrPercent,
    },
  };
}

function pickPromptDict(snapshot) {
  const dict = financialProductModel.getPromptDict();
  const catalog = financialProductModel.getPromptCatalog();
  const selected = {};

  const wantedIds = [
    ...(snapshot.productIds || []),
    ...snapshot.loanList.map((item) => item.productId),
    ...snapshot.assetList.map((item) => item.productId),
  ];

  for (const id of wantedIds) {
    if (id === undefined || id === null || id === "") continue;
    const product = dict[id] || dict[Number(id)];
    if (product) selected[product.productId] = product;
  }

  const loans = catalog.byCategory["대출"] || [];
  const deposits = catalog.byCategory["예적금"] || [];
  for (const product of loans.slice(0, 40)) {
    selected[product.productId] = product;
  }
  for (const product of deposits.slice(0, 8)) {
    selected[product.productId] = product;
  }

  return selected;
}

function buildSystemPrompt() {
  return 'KO debt adj. JSON only. Fields: insight=한국어문장(최대80자), riskLevel=low|medium|high, comment=한국어문장(최대60자), recommendations=[{category,title,detail(최대40자),productId,estimatedMonthlySaving}] max3. insight/comment에 숫자만 쓰지 말 것. 같은대출유형대환만. 법률자문금지.';
}

function buildUserPrompt(snapshot, promptDict, extraNote) {
  const products = Object.values(promptDict || {})
    .slice(0, 8)
    .map((p) => ({
      id: p.productId,
      n: String(p.productName || "").slice(0, 20),
      t: p.productType || p.category,
      r: p.interestRate,
    }));
  return JSON.stringify({
    note: extraNote ? String(extraNote).slice(0, 80) : null,
    f: {
      inc: Math.round((snapshot.monthlyIncome || 0) / 10000),
      debt: Math.round((snapshot.totals?.totalDebt || 0) / 10000),
      assets: Math.round((snapshot.totals?.totalAssets || 0) / 10000),
      pay: Math.round((snapshot.totals?.monthlyPayment || 0) / 10000),
      dsr: snapshot.totals?.dsrPercent ?? null,
    },
    loans: (snapshot.loanList || []).slice(0, 5).map((l) => ({
      id: l.productId ?? null,
      bal: Math.round(Number(l.balance || 0) / 10000),
      r: l.이자율_최저 || l.interestRate || null,
      t: l.상품_유형 || l.productType || null,
    })),
    products,
  });
}

function normalizeRecommendations(rawList, promptDict) {
  if (!Array.isArray(rawList)) return [];
  return rawList.slice(0, 5).map((item) => {
    const productId =
      item?.productId === undefined || item?.productId === null || item?.productId === ""
        ? null
        : Number(item.productId);
    const catalogItem =
      productId === null || Number.isNaN(productId) ? null : promptDict[productId] || null;

    return {
      category: String(item?.category || "채무조정"),
      title: String(item?.title || "조정 제안"),
      detail: String(item?.detail || ""),
      productId: catalogItem ? catalogItem.productId : productId && !Number.isNaN(productId) ? productId : null,
      productName: catalogItem ? catalogItem.productName : null,
      interestRate: catalogItem ? catalogItem.interestRate : null,
      estimatedMonthlySaving: round(item?.estimatedMonthlySaving),
    };
  });
}

function isCompatibleRefinance(holding, candidate) {
  const holdingType = holding.상품_유형 || holding.productType || "";
  if (holdingType && candidate.productType === holdingType) return true;

  const unsecured = new Set(["신용대출", "마이너스대출", "보증부대출", "사업자신용대출"]);
  if (holdingType === "신용대출") {
    return candidate.productType === "신용대출";
  }
  if (!holdingType || unsecured.has(holdingType)) {
    return unsecured.has(candidate.productType);
  }
  return false;
}

function findCheaperRefinance(snapshot, promptDict) {
  const loanProducts = Object.values(promptDict).filter(
    (item) => item.category === "대출" && Number.isFinite(item.interestRate)
  );
  loanProducts.sort((a, b) => a.interestRate - b.interestRate);

  const recommendations = [];
  for (const holding of snapshot.loanList) {
    const currentRate = toNumber(holding.이자율_최저 || holding.interestRate);
    if (!currentRate) continue;
    const cheaper = loanProducts.find(
      (item) =>
        item.productId !== holding.productId &&
        isCompatibleRefinance(holding, item) &&
        item.interestRate + 0.3 < currentRate &&
        (item.maxLimit == null || item.maxLimit >= toNumber(holding.balance))
    );
    if (!cheaper) continue;
    const estimatedMonthlySaving = Math.max(
      0,
      round(toNumber(holding.balance) * ((currentRate - cheaper.interestRate) / 100) / 12)
    );
    recommendations.push({
      category: "대출 대환",
      title: `${holding.상품명 || "보유 대출"} → ${cheaper.productName}`,
      detail: `현재 금리 약 ${currentRate}%에서 ${cheaper.interestRate}%대 상품으로 대환을 검토하세요. ${cheaper.description || ""}`,
      productId: cheaper.productId,
      estimatedMonthlySaving,
    });
  }
  return recommendations;
}

function buildFallbackAnalysis(snapshot, promptDict) {
  const { totals } = snapshot;
  let riskLevel = "low";
  if (totals.dsrPercent != null && totals.dsrPercent >= 40) riskLevel = "high";
  else if (totals.dsrPercent != null && totals.dsrPercent >= 25) riskLevel = "medium";
  if (snapshot.loanList.length === 0) riskLevel = "low";

  const recommendations = findCheaperRefinance(snapshot, promptDict);
  if (snapshot.assetList.length > 0 && totals.totalDebt > 0) {
    recommendations.push({
      category: "예적금 활용",
      title: "비상자금을 남기고 고금리 원금 일부를 상환",
      detail:
        "예적금 전액을 상환에 쓰지 말고, 생활비 3개월분을 남긴 뒤 금리가 높은 대출부터 일부 상환하세요.",
      productId: snapshot.assetList[0]?.productId ?? null,
      estimatedMonthlySaving: 0,
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      category: "상환 우선순위",
      title: "고금리·잔액 작은 대출부터 상환",
      detail: "월 상환 여력이 생기면 금리가 높은 신용대출 원금을 우선 줄이는 것이 유리합니다.",
      productId: null,
      estimatedMonthlySaving: 0,
    });
  }

  const insight =
    totals.dsrPercent != null
      ? `한 달 수입 중 빚 갚는 돈이 약 ${totals.dsrPercent}%쯤 돼요.`
      : "지금 가진 빚과 수입을 기준으로, 조금 덜 부담되게 가는 길을 골라봤어요.";

  return {
    insight,
    riskLevel,
    comment:
      totals.totalDebt > 0
        ? "금리가 더 낮은 상품이 있으면 갈아타는 쪽을 먼저 봐보세요. 실제 한도와 승인은 심사에 따라 달라요."
        : "등록된 대출이 없어요. 목표 금액과 예적금 위주로 차근히 모아가면 좋아요.",
    recommendations,
  };
}

/** AI가 길이 제한 표기(<=80 등)를 값으로 오해한 경우 fallback 사용 */
function pickText(raw, fallback, minLen = 12) {
  const text = String(raw ?? "").trim();
  if (!text) return fallback;
  if (/^<=?\d+/.test(text)) return fallback;
  if (/^\d+(\.\d+)?%?$/.test(text)) return fallback;
  if (text.length < minLen) return fallback;
  return text;
}

function mergeAnalysis(snapshot, promptDict, aiJson) {
  const catalog = financialProductModel.getPromptCatalog();
  const fallback = buildFallbackAnalysis(snapshot, promptDict);
  const source = aiJson && typeof aiJson === "object" ? aiJson : fallback;

  return {
    user: snapshot.user,
    summary: {
      totalDebt: snapshot.totals.totalDebt,
      totalAssets: snapshot.totals.totalAssets,
      monthlyIncome: snapshot.monthlyIncome,
      monthlyPayment: snapshot.totals.monthlyPayment,
      dsrPercent: snapshot.totals.dsrPercent,
      targetAmount: snapshot.targetAmount,
      targetPeriod: snapshot.targetPeriod,
      riskLevel: ["low", "medium", "high"].includes(source.riskLevel)
        ? source.riskLevel
        : fallback.riskLevel,
      insight: pickText(source.insight, fallback.insight),
      comment: pickText(source.comment, fallback.comment, 8),
    },
    loans: snapshot.loanList,
    assets: snapshot.assetList,
    recommendations: normalizeRecommendations(
      source.recommendations || fallback.recommendations,
      promptDict
    ),
    productsUsed: Object.keys(promptDict).map(Number),
    disclaimer: catalog.disclaimer,
  };
}

async function analyze(user, options = {}) {
  const snapshot = buildFinanceSnapshot(user);
  const promptDict = pickPromptDict(snapshot);
  const extraNote = options.note ? String(options.note).slice(0, 80) : "";

  let aiResult = null;
  try {
    const { completeJson } = require("../services/aiClient");
    aiResult = await completeJson(
      buildSystemPrompt(),
      buildUserPrompt(snapshot, promptDict, extraNote),
      { apiKey: options.apiKey, maxTokens: 260, temperature: 0.1 }
    );
  } catch (error) {
    const { aiConfig } = require("../config");
    if (aiConfig.required) {
      throw error;
    }
    aiResult = null;
  }

  if (!aiResult) {
    return mergeAnalysis(snapshot, promptDict, null);
  }

  return mergeAnalysis(snapshot, promptDict, aiResult.json);
}

module.exports = {
  buildFinanceSnapshot,
  pickPromptDict,
  buildFallbackAnalysis,
  analyze,
};
