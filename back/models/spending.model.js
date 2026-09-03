const { aiConfig, PERIODS } = require("../config");
const spendingFile = require("../data/spending.json");

function pad(value) {
  return String(value).padStart(2, "0");
}

function toTimeZoneDateString(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function shiftDateString(dateString, days) {
  const [year, month, day] = dateString.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
}

function lastDayOfMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function getRangeForPeriod(period, now = new Date(), timeZone = aiConfig.evaluation.timezone) {
  const today = toTimeZoneDateString(now, timeZone);
  const yesterday = shiftDateString(today, -1);

  if (period === PERIODS.DAILY) {
    return { from: yesterday, to: yesterday };
  }

  if (period === PERIODS.WEEKLY) {
    return { from: shiftDateString(yesterday, -6), to: yesterday };
  }

  const [year, month] = today.split("-").map(Number);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const from = `${prevYear}-${pad(prevMonth)}-01`;
  const to = `${prevYear}-${pad(prevMonth)}-${pad(lastDayOfMonth(prevYear, prevMonth))}`;
  return { from, to };
}

function listByUserId(userId) {
  const key = String(userId);
  const list = spendingFile.users?.[key];
  return Array.isArray(list) ? list.slice() : [];
}

function findByUserAndRange(userId, range) {
  return listByUserId(userId).filter((item) => {
    const date = String(item.date || "");
    return date >= range.from && date <= range.to;
  });
}

function summarize(spending) {
  const byCategory = {};
  let total = 0;
  for (const item of spending) {
    const amount = Number(item.amount) || 0;
    total += amount;
    const category = item.category || "기타";
    byCategory[category] = (byCategory[category] || 0) + amount;
  }
  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({ category, amount }));
  return { total, byCategory, topCategories, count: spending.length };
}

module.exports = {
  getRangeForPeriod,
  listByUserId,
  findByUserAndRange,
  summarize,
  toTimeZoneDateString,
};
