const { getPreferredApiKey, aiConfig } = require("../config");
const { completeJson } = require("../services/aiClient");

const SCENARIO_LABELS = {
  hold: "지금처럼 쭉",
  save: "한 달 10만원 모으기",
  repay: "한 달 10만원 더 갚기",
  rate: "금리가 오른다면(+1%p)",
  custom: "직접 물어본 경우",
};

const RANGE_LABELS = {
  "1y": "1년",
  "3y": "3년",
  "5y": "5년",
};

const RANGE_MONTHS = {
  "1y": 12,
  "3y": 36,
  "5y": 60,
};

const RANGE_X_LABELS = {
  "1y": ["현재", "3개월", "6개월", "9개월", "1년"],
  "3y": ["현재", "1년", "2년", "3년"],
  "5y": ["현재", "1년", "2년", "3년", "4년", "5년"],
};

function sumField(list, keys) {
  if (!Array.isArray(list)) return 0;
  return list.reduce((sum, item) => {
    for (const key of keys) {
      const n = Number(item?.[key]);
      if (Number.isFinite(n) && n > 0) return sum + n;
    }
    return sum;
  }, 0);
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function compactFinance(user) {
  const income = Math.round(Number(user?.monthlyIncome) || 0);
  const assets = Math.round(sumField(user?.assetList, ["amount", "잔액", "balance"]));
  const debt = Math.round(sumField(user?.loanList, ["balance", "잔액", "amount"]));
  const pay = Math.round(sumField(user?.loanList, ["monthlyPayment", "월상환", "payment"]));
  const target = Math.round(Number(user?.targetAmount) || 0);
  return {
    inc: income,
    assets: assets || 2_000_000,
    debt: debt || 30_000_000,
    pay,
    target,
  };
}

/** 값 시계열 → SVG path (viewBox 0..100, y↓). scaleMin~scaleMax 매핑 */
function seriesToPath(values, scaleMax, scaleMin = 0) {
  const n = Math.max(values.length, 2);
  const span = Math.max(scaleMax - scaleMin, 1);
  return values
    .map((v, i) => {
      const x = Math.round((i / (n - 1)) * 1000) / 10;
      const ratio = clamp((Number(v) - scaleMin) / span, 0, 1);
      const y = Math.round(92 - ratio * 82);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
}

/** 결정적 의사난수 (같은 시나리오면 같은 꺾임) */
function noise01(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * 월별 소비 편차(계절·생활비 흔들림)를 넣어 자산/부채 시계열을 꺾이며 누적
 * sampleCount개 포인트로 다운샘플
 */
function projectWithSpendVariance({
  start,
  months,
  baseMonthlyDelta,
  spendBase,
  mode, // 'asset' | 'debt' | 'hold'
  lump = 0,
  rateShock = 0,
  sampleCount = 13,
  seed = 1,
}) {
  const series = [];
  let value = Math.max(0, start + (mode === "debt" ? -lump : lump));
  series.push(Math.round(value));

  for (let m = 1; m <= months; m += 1) {
    // 계절성: 연말·휴가철 지출↑ / 봄 지출↓
    const monthOfYear = ((m - 1) % 12) + 1;
    const seasonal =
      monthOfYear === 12 || monthOfYear === 1
        ? 1.28
        : monthOfYear === 7 || monthOfYear === 8
          ? 1.14
          : monthOfYear === 3 || monthOfYear === 4
            ? 0.88
            : 1;

    // 생활비 편차 ±18% 정도
    const jitter = 0.82 + noise01(seed * 17 + m * 3.1) * 0.36;
    const spendThisMonth = spendBase * seasonal * jitter;

    // 소득 대비 남는 돈이 저축으로 가는 흐름을 흔들림 반영
    let delta = baseMonthlyDelta;
    if (mode === "asset" || mode === "hold") {
      // 지출이 크면 그달 저축이 줄고, 적으면 불어남
      const spendPressure = (spendThisMonth - spendBase) * 0.55;
      delta = baseMonthlyDelta - spendPressure;
      // 가끔 한 분기 크게 아끼거나 쓰는 구간
      if (m % 11 === 0) delta += baseMonthlyDelta * 1.6;
      if (m % 17 === 0) delta -= Math.abs(baseMonthlyDelta) * 0.9;
      value = Math.max(0, value + delta);
    } else {
      // 부채: 상환 + 금리 충격, 지출 많으면 상환 여력↓
      const repayAbility = Math.max(0.35, 1 - (spendThisMonth / Math.max(spendBase, 1) - 1) * 0.4);
      let repay = baseMonthlyDelta * repayAbility; // baseMonthlyDelta is positive repay amount
      if (rateShock > 0) {
        value = value * (1 + rateShock / 12);
      }
      if (m % 13 === 0) repay *= 1.8; // 보너스성 추가 상환
      if (m % 19 === 0) repay *= 0.4; // 여유 없는 달
      value = Math.max(0, value - repay);
    }
    series.push(Math.round(value));
  }

  // 다운샘플 (시작·끝 포함)
  const out = [];
  const last = series.length - 1;
  for (let i = 0; i < sampleCount; i += 1) {
    const idx = Math.round((i / (sampleCount - 1)) * last);
    out.push(series[idx]);
  }
  return out;
}

function sampleCountForRange(range) {
  if (range === "5y") return 21; // 꺾임이 잘 보이게 포인트 많게
  if (range === "3y") return 13;
  return 9;
}

function formatManwonLabel(won) {
  if (won >= 100_000_000) return `${(won / 100_000_000).toFixed(1)}억`;
  return `${Math.round(won / 10_000).toLocaleString("ko-KR")}만`;
}

function scenarioDefaults(scenario) {
  if (scenario === "save") return { save: 100_000, repay: 0, lumpSave: 0, lumpRepay: 0, rateShock: 0 };
  if (scenario === "repay") return { save: 0, repay: 100_000, lumpSave: 0, lumpRepay: 0, rateShock: 0 };
  if (scenario === "rate") return { save: 30_000, repay: 0, lumpSave: 0, lumpRepay: 0, rateShock: 0.01 };
  if (scenario === "hold") return { save: 30_000, repay: 0, lumpSave: 0, lumpRepay: 0, rateShock: 0 };
  return { save: 0, repay: 0, lumpSave: 0, lumpRepay: 0, rateShock: 0 };
}

function inferFromPrompt(prompt) {
  const text = String(prompt || "");
  let amount = 0;
  const man = text.match(/(\d+(?:\.\d+)?)\s*만/);
  const won = text.match(/(\d{4,})\s*원/);
  if (man) amount = Math.round(Number(man[1]) * 10000);
  else if (won) amount = Math.round(Number(won[1]));

  const isRepay = /갚|상환|빚|대출|부채/.test(text);
  const isSave = /저축|모으|저금|적금|아끼/.test(text);
  const isMonthly = /매월|매달|월\s*\d|한\s*달/.test(text);
  const isLump = /보너스|일시|한\s*번|목돈|한꺼번에/.test(text) || (!isMonthly && amount >= 500_000);

  const out = { save: 0, repay: 0, lumpSave: 0, lumpRepay: 0 };
  if (!amount) return out;

  if (isRepay) {
    if (isLump || !isMonthly) out.lumpRepay = amount;
    else out.repay = amount;
  } else if (isSave) {
    if (isLump || !isMonthly) out.lumpSave = amount;
    else out.save = amount;
  } else if (isMonthly) {
    out.save = amount;
  } else {
    out.lumpRepay = amount;
  }
  return out;
}

function pickNumber(...candidates) {
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n)) return Math.round(n);
  }
  return undefined;
}

function buildChart(finance, scenario, range, overrides = {}) {
  const safeRange = RANGE_MONTHS[range] ? range : "5y";
  const months = RANGE_MONTHS[safeRange] || 60;
  const defaults = scenarioDefaults(scenario);
  const points = sampleCountForRange(safeRange);

  let monthlySave = pickNumber(overrides.save, defaults.save) ?? 0;
  const monthlyRepay = pickNumber(overrides.repay, defaults.repay) ?? 0;
  const lumpSave = pickNumber(overrides.lumpSave, defaults.lumpSave) ?? 0;
  const lumpRepay = pickNumber(overrides.lumpRepay, defaults.lumpRepay) ?? 0;
  const rateShock = defaults.rateShock;

  const assets0 = finance.assets;
  const debt0 = finance.debt;
  const income = Math.max(finance.inc || 0, 1);
  // 소비자 지출 가정: 수입의 ~55% (생활비) — 편차의 기준
  const spendBase = Math.round(income * 0.55);

  const holdMonthly = 30_000;
  if (scenario === "hold" && overrides.save == null) {
    monthlySave = holdMonthly;
  }

  const seed =
    (scenario === "save" ? 2 : scenario === "repay" ? 3 : scenario === "rate" ? 4 : 1) +
    months;

  const assetSeries = projectWithSpendVariance({
    start: assets0,
    months,
    baseMonthlyDelta: monthlySave + Math.round(monthlySave * 0.02),
    spendBase,
    mode: "asset",
    lump: lumpSave,
    sampleCount: points,
    seed,
  });

  const holdSeries = projectWithSpendVariance({
    start: assets0,
    months,
    baseMonthlyDelta: holdMonthly,
    spendBase,
    mode: "hold",
    lump: 0,
    sampleCount: points,
    seed: seed + 99,
  });

  const debtSeries = projectWithSpendVariance({
    start: debt0,
    months,
    baseMonthlyDelta: Math.max(monthlyRepay, finance.pay * 0.15, 20_000),
    spendBase,
    mode: "debt",
    lump: lumpRepay,
    rateShock,
    sampleCount: points,
    seed: seed + 41,
  });

  // 시나리오가 저축이면 부채는 기존 상환만, 상환 시나리오면 추가 반영은 이미 monthlyRepay에
  if (scenario === "save" || (scenario === "hold" && monthlyRepay === 0 && lumpRepay === 0)) {
    // 빚은 느리게만 줄어들거나 거의 평평 + 약간의 흔들림 (이미 위 로직)
  }

  const assetMax = Math.max(...assetSeries, ...holdSeries, 1);
  const assetMin = 0;
  const assetScale = assetMax * 1.12;

  const debtMax = Math.max(...debtSeries, debt0, 1);
  const debtMinRaw = Math.min(...debtSeries, debt0);
  const debtPad = Math.max((debtMax - debtMinRaw) * 0.45, debtMax * 0.08, 500_000);
  const debtScaleMax = debtMax + debtPad * 0.2;
  const debtScaleMin = Math.max(0, debtMinRaw - debtPad);

  const scenarioAssetEnd = assetSeries[assetSeries.length - 1];
  const holdAssetEnd = holdSeries[holdSeries.length - 1];
  const debtEnd = debtSeries[debtSeries.length - 1];
  const gap = scenarioAssetEnd - holdAssetEnd;
  const debtDrop = debt0 - debtEnd;

  let gapLabel;
  if (debtDrop >= 100_000 && (lumpRepay > 0 || monthlyRepay > 0) && gap <= 0) {
    gapLabel = `빚 −${Math.round(debtDrop / 10000).toLocaleString("ko-KR")}만 원`;
  } else if (Math.abs(gap) >= 10_000) {
    gapLabel = `${gap > 0 ? "+" : ""}${Math.round(gap / 10000).toLocaleString("ko-KR")}만 원`;
  } else if (debtDrop >= 10_000) {
    gapLabel = `빚 −${Math.round(debtDrop / 10000).toLocaleString("ko-KR")}만 원`;
  } else {
    gapLabel = "+ 0원";
  }

  return {
    assetPath: seriesToPath(assetSeries, assetScale, assetMin),
    holdPath: seriesToPath(holdSeries, assetScale, assetMin),
    debtPath: seriesToPath(debtSeries, debtScaleMax, debtScaleMin),
    yMaxLabel: formatManwonLabel(assetScale),
    xLabels: RANGE_X_LABELS[safeRange] || RANGE_X_LABELS["5y"],
    assetGapLabel: gapLabel,
    monthlySave,
    monthlyRepay,
    lumpSave,
    lumpRepay,
  };
}

function buildFallback(prompt, scenario, range, finance, overrides = {}) {
  const scenarioLabel =
    scenario === "custom" && prompt
      ? String(prompt).slice(0, 28)
      : SCENARIO_LABELS[scenario] || scenario;
  const rangeLabel = RANGE_LABELS[range] || range;
  const chart = buildChart(finance, scenario, range, overrides);
  return {
    insight: `${prompt || scenarioLabel}로 ${rangeLabel} 뒤를 그려봤어요.`,
    assetGapLabel: chart.assetGapLabel,
    goalAcceleration:
      chart.lumpRepay > 0 || chart.monthlyRepay > 0
        ? "빚이 더 빨리 줄어요"
        : scenario === "hold"
          ? "큰 변화 없어요"
          : "2개월 빨라져요",
    annualReturn: scenario === "rate" ? "금리 +1%p 가정" : "연 5% 정도로 가정",
    strategy:
      chart.lumpRepay > 0 || chart.monthlyRepay > 0
        ? "갚을 금액은 자동이체로 빼두면 놓치지 않아요."
        : "아낀 돈은 비상금부터 채우고, 그다음 저축·상환 순으로 나눠보세요.",
    scenarioLabel,
    rangeLabel,
    chart: {
      assetPath: chart.assetPath,
      holdPath: chart.holdPath,
      debtPath: chart.debtPath,
      yMaxLabel: chart.yMaxLabel,
      xLabels: chart.xLabels,
    },
  };
}

function parseAiOverrides(source) {
  // ms/mr = 월 저축·상환(만원), ls/lr = 일시 저축·상환(만원)
  const ms = Number(source?.ms);
  const mr = Number(source?.mr);
  const ls = Number(source?.ls ?? source?.lumpSave);
  const lr = Number(source?.lr ?? source?.lumpRepay);
  return {
    save: Number.isFinite(ms) ? Math.round(ms * 10000) : undefined,
    repay: Number.isFinite(mr) ? Math.round(mr * 10000) : undefined,
    lumpSave: Number.isFinite(ls) ? Math.round(ls * 10000) : undefined,
    lumpRepay: Number.isFinite(lr) ? Math.round(lr * 10000) : undefined,
  };
}

function mergeOverrides(inferred, ai) {
  return {
    save: ai.save ?? inferred.save,
    repay: ai.repay ?? inferred.repay,
    lumpSave: ai.lumpSave ?? inferred.lumpSave,
    lumpRepay: ai.lumpRepay ?? inferred.lumpRepay,
  };
}

async function run({ user, prompt, scenario = "custom", range = "5y", apiKey }) {
  const safeScenario = SCENARIO_LABELS[scenario] ? scenario : "custom";
  const safeRange = RANGE_MONTHS[range] ? range : "5y";
  const rangeLabel = RANGE_LABELS[safeRange] || String(safeRange);
  const finance = compactFinance(user);
  const inferred = safeScenario === "custom" ? inferFromPrompt(prompt) : {};
  const fallback = buildFallback(prompt, safeScenario, safeRange, finance, inferred);

  const systemPrompt =
    'KO finance sim. JSON only:{"i":"<=80자","g":"+N만|빚-N만","t":"짧은문구","r":"N%","s":"<=60자","ms":월저축만,"mr":월상환만,"ls":일시저축만,"lr":일시상환만}. 단위=만원정수. 보너스·목돈 빚갚기→lr. 법률자문금지.';

  const userPrompt = JSON.stringify({
    q: String(prompt || "").slice(0, 80),
    sc: safeScenario,
    rg: safeRange,
    f: {
      inc: Math.round(finance.inc / 10000),
      a: Math.round(finance.assets / 10000),
      d: Math.round(finance.debt / 10000),
      p: Math.round(finance.pay / 10000),
      t: Math.round(finance.target / 10000),
    },
  });

  let aiResult = null;
  try {
    aiResult = await completeJson(systemPrompt, userPrompt, {
      apiKey: apiKey || getPreferredApiKey(),
      maxTokens: 200,
      temperature: 0.1,
    });
  } catch (error) {
    if (aiConfig.required) throw error;
    aiResult = null;
  }

  const source =
    aiResult?.json && typeof aiResult.json === "object" ? aiResult.json : null;
  const aiOverrides = source ? parseAiOverrides(source) : {};
  const overrides = mergeOverrides(inferred, aiOverrides);
  const chartBuilt = buildChart(finance, safeScenario, safeRange, overrides);

  const insight = String(source?.i || source?.insight || fallback.insight).slice(0, 160);
  const strategy = String(source?.s || source?.strategy || fallback.strategy).slice(0, 120);
  const scenarioLabel =
    safeScenario === "custom" && prompt
      ? String(prompt).slice(0, 28)
      : SCENARIO_LABELS[safeScenario] || String(safeScenario);

  return {
    insight,
    assetGapLabel: String(source?.g || source?.assetGapLabel || chartBuilt.assetGapLabel),
    goalAcceleration: String(source?.t || source?.goalAcceleration || fallback.goalAcceleration),
    annualReturn: String(source?.r || source?.annualReturn || fallback.annualReturn),
    strategy,
    scenarioLabel,
    rangeLabel,
    prompt: prompt || "",
    scenario: safeScenario,
    range: safeRange,
    chart: {
      assetPath: chartBuilt.assetPath,
      holdPath: chartBuilt.holdPath,
      debtPath: chartBuilt.debtPath,
      yMaxLabel: chartBuilt.yMaxLabel,
      xLabels: chartBuilt.xLabels,
    },
  };
}

module.exports = {
  run,
  SCENARIO_LABELS,
  RANGE_LABELS,
  compactFinance,
  buildChart,
  inferFromPrompt,
};
