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
  return [
    "당신은 한국 개인금융 채무조정 보조 분석가입니다.",
    "법률·세무 자문이 아니며, 실제 금리·한도·승인은 개인 신용과 금융사 심사를 따릅니다.",
    "입력된 이용자 재무 정보와 금융상품 카탈로그만 근거로 사용하세요.",
    "반드시 JSON 객체만 반환하세요. 키는 다음을 지킵니다:",
    '{ "insight": string, "riskLevel": "low"|"medium"|"high", "comment": string, "recommendations": [ { "category": string, "title": string, "detail": string, "productId": number|null, "estimatedMonthlySaving": number } ] }',
    "recommendations는 1~5개. productId는 카탈로그에 있는 값만 사용합니다.",
    "고금리 대출을 더 낮은 금리 상품으로 대환하는 방안을 우선 검토하세요.",
    "대환 후보는 보유 대출과 같은 유형(예: 신용대출→신용대출)만 고르세요. 전세·주담대·학자금으로 신용대출을 바꾸라고 하지 마세요.",
    "예적금은 비상자금 유지와 조기 상환 재원으로만 제안하세요.",
  ].join("\n");
}

function buildUserPrompt(snapshot, promptDict, extraNote) {
  return JSON.stringify(
    {
      instruction: "위 이용자의 채무조정 분석 JSON을 작성하세요.",
      extraNote: extraNote || null,
      finance: snapshot,
      products: promptDict,
    },
    null,
    2
  );
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
      ? `월 소득 대비 대출 상환 비율(DSR)은 약 ${totals.dsrPercent}%입니다.`
      : "저장된 대출 상환액과 소득을 기준으로 채무조정 방향을 제안합니다.";

  return {
    insight,
    riskLevel,
    comment:
      totals.totalDebt > 0
        ? "카탈로그상 더 낮은 금리 상품이 있으면 대환을 우선 검토하세요. 실제 한도와 승인은 신용·소득 심사를 따릅니다."
        : "등록된 대출이 없습니다. 목표 금액과 예적금 위주로 저축 계획을 유지하세요.",
    recommendations,
  };
}

function mergeAnalysis(snapshot, promptDict, aiJson, provider, model) {
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
      insight: String(source.insight || fallback.insight),
      comment: String(source.comment || fallback.comment),
    },
    loans: snapshot.loanList,
    assets: snapshot.assetList,
    recommendations: normalizeRecommendations(
      source.recommendations || fallback.recommendations,
      promptDict
    ),
    productsUsed: Object.keys(promptDict).map(Number),
    disclaimer: catalog.disclaimer,
    provider,
    model: model || null,
  };
}

async function analyze(user, options = {}) {
  const snapshot = buildFinanceSnapshot(user);
  const promptDict = pickPromptDict(snapshot);
  const extraNote = options.note ? String(options.note).slice(0, 500) : "";

  let aiResult = null;
  try {
    const { completeJson } = require("../services/aiClient");
    aiResult = await completeJson(
      buildSystemPrompt(),
      buildUserPrompt(snapshot, promptDict, extraNote)
    );
  } catch (error) {
    if (process.env.AI_REQUIRED === "true") {
      throw error;
    }
    aiResult = null;
  }

  if (!aiResult) {
    return mergeAnalysis(snapshot, promptDict, null, "fallback", null);
  }

  return mergeAnalysis(
    snapshot,
    promptDict,
    aiResult.json,
    aiResult.provider,
    aiResult.model
  );
}

module.exports = {
  buildFinanceSnapshot,
  pickPromptDict,
  buildFallbackAnalysis,
  analyze,
};
