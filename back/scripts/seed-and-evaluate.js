/**
 * 로컬 데모: demo01 로그인 → 최근 6개월 가계부 시드 → 월간 평가
 * 사용: node back/scripts/seed-and-evaluate.js
 * API_BASE 기본: http://127.0.0.1:5000/api
 */
require("../config/supabaseConfig").loadProjectEnv();

const BASE = process.env.API_BASE || "http://127.0.0.1:5000/api";

const DEMO = {
  loginId: "demo01",
  password: "pass1234",
  email: "demo01@example.com",
  name: "데모유저",
  monthlyIncome: 4200000,
  targetAmount: 5000000,
  targetPeriod: 12,
  assetList: [
    { productId: 10, amount: 2000000, 상품명: "KB Star 정기예금", isManual: false },
  ],
  loanList: [
    {
      productId: 95,
      balance: 30000000,
      monthlyPayment: 450000,
      상품명: "신용대출 샘플",
      은행명: "샘플저축은행",
      상품_유형: "신용대출",
      이자율_최저: 6.5,
      이자율_최고: 11,
    },
  ],
  productIds: [95, 10],
};

function pad(n) {
  return String(n).padStart(2, "0");
}

function monthDates(year, month) {
  const days = new Date(year, month, 0).getDate();
  const list = [];
  for (let d = 1; d <= days; d += 1) {
    list.push(`${year}-${pad(month)}-${pad(d)}`);
  }
  return list;
}

/** 최근 N개월 (현재 달 포함) [{year, month}, ...] 오래된 달부터 */
function lastNMonths(n, from = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(from.getFullYear(), from.getMonth() - i, 1);
    out.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return out;
}

function buildTransactions(year, month) {
  const dates = monthDates(year, month);
  const rows = [
    { type: "income", amount: 4200000, category: "급여", memo: `${month}월 급여`, date: `${year}-${pad(month)}-01` },
  ];
  const expenses = [
    ["식비", 18000, "편의점"],
    ["카페", 5500, "커피"],
    ["교통", 1250, "지하철"],
    ["구독", 13500, "OTT"],
    ["쇼핑", 42000, "쿠팡"],
    ["통신", 55000, "통신비"],
    ["식비", 32000, "배달"],
    ["주거", 450000, "월세"],
  ];
  // 월마다 약간 다르게 (중복 느낌 완화)
  const drift = ((year * 12 + month) % 5) * 1000;
  dates.forEach((date, idx) => {
    if (idx % 2 === 0) {
      const [category, amount, memo] = expenses[idx % expenses.length];
      rows.push({ type: "expense", amount: amount + drift, category, memo, date });
    }
    if (idx % 5 === 0) {
      rows.push({ type: "expense", amount: 22000 + (month % 3) * 500, category: "식비", memo: "점심", date });
    }
  });
  return rows;
}

async function request(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

async function main() {
  console.log("BASE", BASE);

  // 데모 자동로그인은 프로필 없이도 200을 줄 수 있음 → 가입을 먼저 보장
  try {
    await request("/auth/signup", { method: "POST", body: DEMO });
    console.log("signup ok");
  } catch (error) {
    if (error.status === 409) {
      console.log("signup skipped (already exists)");
    } else {
      console.warn("signup warning:", error.message, error.body || "");
    }
  }

  const login = await request("/auth/login", {
    method: "POST",
    body: { loginId: DEMO.loginId, password: DEMO.password },
  });
  console.log("login ok", login.user?.loginId, "id=", login.user?.id);

  if (!login.user?.id || login.user.id === "demo") {
    throw new Error(
      "demo01 프로필이 DB에 없습니다. Supabase SQL(001_init) 실행·SERVICE_ROLE_KEY 확인 후 다시 시도하세요."
    );
  }

  const token = login.accessToken;
  const months = lastNMonths(6);
  console.log(
    "target months:",
    months.map((m) => `${m.year}-${pad(m.month)}`).join(", ")
  );

  for (const { year, month } of months) {
    const existing = await request(`/account-book?year=${year}&month=${month}`, { token });
    const count = existing.count ?? existing.transactions?.length ?? 0;
    if (count >= 10) {
      console.log(`skip ${year}-${pad(month)} (already ${count} rows)`);
      continue;
    }

    const rows = buildTransactions(year, month);
    let created = 0;
    for (const row of rows) {
      await request("/account-book", { method: "POST", token, body: row });
      created += 1;
    }
    console.log(`seeded ${created} transactions for ${year}-${pad(month)}`);
  }

  const evaluation = await request("/spending-evaluations/run", {
    method: "POST",
    token,
    body: { period: "monthly" },
  });

  console.log("riskLevel:", evaluation.riskLevel);
  console.log("insight:", evaluation.insight);
  console.log(
    "recommendations:",
    (evaluation.recommendations || []).map((r) => r.title).join(" | ")
  );
}

main().catch((error) => {
  console.error("FAILED", error.message, error.body || "");
  process.exit(1);
});
