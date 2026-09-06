/**
 * API 없이 Supabase에 직접 demo01 가계부 시드
 * 사용: node scripts/seed-direct.js
 */
require("../config/supabaseConfig").loadProjectEnv();
const { createClient } = require("@supabase/supabase-js");

const DEMO_LOGIN_ID = "demo01";
const USER_ID_FALLBACK = null;

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

function lastNMonths(n, from = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(from.getFullYear(), from.getMonth() - i, 1);
    out.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return out;
}

function buildTransactions(userId, year, month) {
  const dates = monthDates(year, month);
  const rows = [
    {
      user_id: userId,
      type: "income",
      amount: 4200000,
      category: "급여",
      memo: `${month}월 급여`,
      date: `${year}-${pad(month)}-01`,
    },
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
  const drift = ((year * 12 + month) % 5) * 1000;
  dates.forEach((date, idx) => {
    if (idx % 2 === 0) {
      const [category, amount, memo] = expenses[idx % expenses.length];
      rows.push({
        user_id: userId,
        type: "expense",
        amount: amount + drift,
        category,
        memo,
        date,
      });
    }
    if (idx % 5 === 0) {
      rows.push({
        user_id: userId,
        type: "expense",
        amount: 22000 + (month % 3) * 500,
        category: "식비",
        memo: "점심",
        date,
      });
    }
  });
  return rows;
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY required");

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("id,login_id")
    .eq("login_id", DEMO_LOGIN_ID)
    .maybeSingle();
  if (pErr) throw pErr;
  const userId = profile?.id || USER_ID_FALLBACK;
  if (!userId) throw new Error("demo01 profile missing");

  console.log("demo user", profile.login_id, userId);

  // auth helpers (DB URL 없으면 스킵)
  const fs = require("fs");
  const path = require("path");
  const sqlPath = path.join(__dirname, "..", "sql", "002_auth_helpers.sql");
  if (process.env.SUPABASE_DB_URL) {
    try {
      const { Client } = require("pg");
      const client = new Client({
        connectionString: process.env.SUPABASE_DB_URL,
        ssl: { rejectUnauthorized: false },
      });
      await client.connect();
      await client.query(fs.readFileSync(sqlPath, "utf8"));
      console.log("applied 002_auth_helpers.sql");
      await client.end();
    } catch (sqlError) {
      console.warn("skip SQL helpers:", sqlError.message);
    }
  } else {
    console.log("skip SQL helpers (no SUPABASE_DB_URL)");
  }

  const months = lastNMonths(6);
  for (const { year, month } of months) {
    const from = `${year}-${pad(month)}-01`;
    const to = `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`;
    const { count, error: cErr } = await admin
      .from("account_book_transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("date", from)
      .lte("date", to);
    if (cErr) throw cErr;
    if ((count || 0) >= 10) {
      console.log(`skip ${year}-${pad(month)} (already ${count})`);
      continue;
    }
    const rows = buildTransactions(userId, year, month);
    const { error: iErr } = await admin.from("account_book_transactions").insert(rows);
    if (iErr) throw iErr;
    console.log(`seeded ${rows.length} for ${year}-${pad(month)}`);
  }

  console.log("DONE");
}

main().catch((e) => {
  console.error("FAILED", e.message || e);
  process.exit(1);
});
