const {
  TRANSACTION_TYPES,
  DATE_RE,
  MAX_MEMO_LENGTH,
  MAX_CATEGORY_LENGTH,
} = require("../schema/accountBook.schema");

function readTrimmed(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function normalizeDate(value) {
  const raw = readTrimmed(value);
  if (!raw) return "";
  if (DATE_RE.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function parseAmount(value) {
  if (value === undefined || value === null || value === "") {
    return { ok: false, error: "amount is required" };
  }
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "invalid amount" };
  }
  return { ok: true, value: Math.round(amount * 100) / 100 };
}

function parseType(value) {
  const type = readTrimmed(value).toLowerCase();
  if (!TRANSACTION_TYPES.includes(type)) {
    return { ok: false, error: "invalid type" };
  }
  return { ok: true, value: type };
}

function parseCategory(value) {
  const category = readTrimmed(value);
  if (!category) return { ok: false, error: "category is required" };
  if (category.length > MAX_CATEGORY_LENGTH) {
    return { ok: false, error: "invalid category" };
  }
  return { ok: true, value: category };
}

function parseMemo(value, required) {
  const memo = value === undefined || value === null ? "" : String(value).trim();
  if (required && !memo) return { ok: false, error: "memo is required" };
  if (memo.length > MAX_MEMO_LENGTH) return { ok: false, error: "invalid memo" };
  return { ok: true, value: memo };
}

function parseCreateBody(body) {
  const type = parseType(body?.type);
  if (!type.ok) {
    return { error: body?.type ? type.error : "type is required" };
  }
  const amount = parseAmount(body?.amount);
  if (!amount.ok) return { error: amount.error };
  const category = parseCategory(body?.category);
  if (!category.ok) return { error: category.error };
  const memo = parseMemo(body?.memo ?? body?.title, false);
  if (!memo.ok) return { error: memo.error };
  const date = normalizeDate(body?.date);
  if (!date) return { error: body?.date ? "invalid date" : "date is required" };

  return {
    data: {
      type: type.value,
      amount: amount.value,
      category: category.value,
      memo: memo.value,
      date,
    },
  };
}

function parseUpdateBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "invalid body" };
  }

  const data = {};
  if (body.type !== undefined) {
    const type = parseType(body.type);
    if (!type.ok) return { error: type.error };
    data.type = type.value;
  }
  if (body.amount !== undefined) {
    const amount = parseAmount(body.amount);
    if (!amount.ok) return { error: amount.error };
    data.amount = amount.value;
  }
  if (body.category !== undefined) {
    const category = parseCategory(body.category);
    if (!category.ok) return { error: category.error };
    data.category = category.value;
  }
  if (body.memo !== undefined || body.title !== undefined) {
    const memo = parseMemo(body.memo ?? body.title, false);
    if (!memo.ok) return { error: memo.error };
    data.memo = memo.value;
  }
  if (body.date !== undefined) {
    const date = normalizeDate(body.date);
    if (!date) return { error: "invalid date" };
    data.date = date;
  }

  if (Object.keys(data).length === 0) {
    return { error: "no fields to update" };
  }
  return { data };
}

function parseListQuery(query) {
  const yearRaw = query?.year;
  const monthRaw = query?.month;
  let year = null;
  let month = null;

  if (yearRaw !== undefined && yearRaw !== "") {
    year = Number(yearRaw);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return { error: "invalid year" };
    }
  }
  if (monthRaw !== undefined && monthRaw !== "") {
    month = Number(monthRaw);
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return { error: "invalid month" };
    }
  }
  if (month != null && year == null) {
    return { error: "year is required" };
  }

  const from = query?.from ? normalizeDate(query.from) : "";
  const to = query?.to ? normalizeDate(query.to) : "";
  if (query?.from && !from) return { error: "invalid from" };
  if (query?.to && !to) return { error: "invalid to" };
  if (from && to && from > to) return { error: "invalid range" };

  let type = null;
  if (query?.type) {
    const parsed = parseType(query.type);
    if (!parsed.ok) return { error: parsed.error };
    type = parsed.value;
  }

  return {
    data: {
      year,
      month,
      from: from || null,
      to: to || null,
      type,
      category: query?.category ? readTrimmed(query.category) : null,
    },
  };
}

module.exports = {
  normalizeDate,
  parseCreateBody,
  parseUpdateBody,
  parseListQuery,
};
