const spendingFile = require("../data/spending.json");

let nextId = 1;
const transactions = [];

function toPublic(item) {
  return {
    id: item.id,
    userId: item.userId,
    type: item.type,
    amount: item.amount,
    category: item.category,
    memo: item.memo,
    date: item.date,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function inRange(item, filter) {
  if (filter.year != null && filter.month != null) {
    const prefix = `${filter.year}-${String(filter.month).padStart(2, "0")}`;
    if (!item.date.startsWith(prefix)) return false;
  } else if (filter.year != null) {
    if (!item.date.startsWith(`${filter.year}-`)) return false;
  }
  if (filter.from && item.date < filter.from) return false;
  if (filter.to && item.date > filter.to) return false;
  if (filter.type && item.type !== filter.type) return false;
  if (filter.category && item.category !== filter.category) return false;
  return true;
}

function listByUser(userId, filter = {}) {
  return transactions
    .filter((item) => item.userId === userId)
    .filter((item) => inRange(item, filter))
    .sort((a, b) => {
      if (a.date === b.date) return b.id - a.id;
      return a.date < b.date ? 1 : -1;
    })
    .map(toPublic);
}

function findByIdForUser(id, userId) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return null;
  return (
    transactions.find((item) => item.id === numericId && item.userId === userId) ||
    null
  );
}

function create(userId, data) {
  const now = new Date().toISOString();
  const item = {
    id: nextId++,
    userId,
    type: data.type,
    amount: data.amount,
    category: data.category,
    memo: data.memo || "",
    date: data.date,
    createdAt: now,
    updatedAt: now,
  };
  transactions.push(item);
  return toPublic(item);
}

function update(id, userId, data) {
  const item = findByIdForUser(id, userId);
  if (!item) return null;
  const stored = transactions.find((row) => row.id === item.id);
  Object.assign(stored, data, { updatedAt: new Date().toISOString() });
  return toPublic(stored);
}

function remove(id, userId) {
  const index = transactions.findIndex(
    (item) => item.id === Number(id) && item.userId === userId
  );
  if (index < 0) return false;
  transactions.splice(index, 1);
  return true;
}

function summarize(userId, filter = {}) {
  const list = listByUser(userId, filter);
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

function categorySummary(userId, filter = {}) {
  const list = listByUser(userId, filter);
  const totals = summarize(userId, filter);
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

function seedFromSpendingFile() {
  const rows = spendingFile.users?.["1"] || [];
  for (const row of rows) {
    create(1, {
      type: "expense",
      amount: row.amount,
      category: row.category,
      memo: row.merchant || "",
      date: row.date,
    });
  }
  create(1, {
    type: "income",
    amount: 4200000,
    category: "급여",
    memo: "9월 급여",
    date: "2026-09-01",
  });
  create(1, {
    type: "income",
    amount: 4200000,
    category: "급여",
    memo: "8월 급여",
    date: "2026-08-25",
  });
}

seedFromSpendingFile();

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
