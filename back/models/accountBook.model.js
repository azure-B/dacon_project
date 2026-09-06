const { getDataClient } = require("../services/supabase");

function toPublic(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    userId: row.user_id,
    type: row.type,
    amount: Number(row.amount),
    category: row.category,
    memo: row.memo || "",
    date: String(row.date).slice(0, 10),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyFilters(query, filter = {}) {
  let q = query;
  if (filter.year != null && filter.month != null) {
    const y = Number(filter.year);
    const m = Number(filter.month);
    const from = `${y}-${String(m).padStart(2, "0")}-01`;
    const nextMonth = m === 12 ? 1 : m + 1;
    const nextYear = m === 12 ? y + 1 : y;
    const toExclusive = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
    q = q.gte("date", from).lt("date", toExclusive);
  } else if (filter.year != null) {
    const y = Number(filter.year);
    q = q.gte("date", `${y}-01-01`).lt("date", `${y + 1}-01-01`);
  }
  if (filter.from) q = q.gte("date", filter.from);
  if (filter.to) q = q.lte("date", filter.to);
  if (filter.type) q = q.eq("type", filter.type);
  if (filter.category) q = q.eq("category", filter.category);
  return q;
}

async function listByUser(userId, filter = {}, accessToken = "") {
  const db = getDataClient(accessToken);
  let query = db
    .from("account_book_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("id", { ascending: false });
  query = applyFilters(query, filter);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(toPublic);
}

async function findByIdForUser(id, userId, accessToken = "") {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return null;
  const db = getDataClient(accessToken);
  const { data, error } = await db
    .from("account_book_transactions")
    .select("*")
    .eq("id", numericId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return toPublic(data);
}

async function create(userId, data, accessToken = "") {
  const db = getDataClient(accessToken);
  const { data: row, error } = await db
    .from("account_book_transactions")
    .insert({
      user_id: userId,
      type: data.type,
      amount: data.amount,
      category: data.category,
      memo: data.memo || "",
      date: data.date,
    })
    .select("*")
    .single();
  if (error) throw error;
  return toPublic(row);
}

async function update(id, userId, data, accessToken = "") {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return null;
  const db = getDataClient(accessToken);
  const { data: row, error } = await db
    .from("account_book_transactions")
    .update(data)
    .eq("id", numericId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return toPublic(row);
}

async function remove(id, userId, accessToken = "") {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return false;
  const db = getDataClient(accessToken);
  const { data, error } = await db
    .from("account_book_transactions")
    .delete()
    .eq("id", numericId)
    .eq("user_id", userId)
    .select("id");
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

async function summarize(userId, filter = {}, accessToken = "") {
  const list = await listByUser(userId, filter, accessToken);
  let totalIncome = 0;
  let totalExpense = 0;
  for (const item of list) {
    if (item.type === "income") totalIncome += item.amount;
    else totalExpense += item.amount;
  }
  return {
    year: filter.year ?? null,
    month: filter.month ?? null,
    from: filter.from ?? null,
    to: filter.to ?? null,
    count: list.length,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
}

async function categorySummary(userId, filter = {}, accessToken = "") {
  const list = await listByUser(userId, filter, accessToken);
  const totals = await summarize(userId, filter, accessToken);
  const map = new Map();

  for (const item of list) {
    const key = `${item.type}:${item.category}`;
    const current = map.get(key) || {
      type: item.type,
      category: item.category,
      amount: 0,
      count: 0,
    };
    current.amount += item.amount;
    current.count += 1;
    map.set(key, current);
  }

  const items = [...map.values()]
    .map((row) => {
      const base = row.type === "income" ? totals.totalIncome : totals.totalExpense;
      const ratio = base > 0 ? Math.round((row.amount / base) * 1000) / 10 : 0;
      return { ...row, ratio };
    })
    .sort((a, b) => b.amount - a.amount);

  return {
    year: filter.year ?? null,
    month: filter.month ?? null,
    from: filter.from ?? null,
    to: filter.to ?? null,
    totalIncome: totals.totalIncome,
    totalExpense: totals.totalExpense,
    items,
  };
}

module.exports = {
  toPublic,
  listByUser,
  findByIdForUser,
  create,
  update,
  remove,
  summarize,
  categorySummary,
};
