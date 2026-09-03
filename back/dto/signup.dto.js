const {
  LOGIN_ID_RE,
  EMAIL_RE,
  PASSWORD_LETTER_RE,
  PASSWORD_DIGIT_RE,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  MAX_LIST_LENGTH,
  MAX_NAME_LENGTH,
} = require("../schema/signup.schema");

function asObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function readTrimmed(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function firstTrimmed(...values) {
  for (const value of values) {
    const text = readTrimmed(value);
    if (text) return text;
  }
  return "";
}

function firstPassword(...values) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const text = String(value);
    if (text !== "") return text;
  }
  return "";
}

function isValidPassword(password) {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH &&
    PASSWORD_LETTER_RE.test(password) &&
    PASSWORD_DIGIT_RE.test(password)
  );
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined) return value;
  }
  return undefined;
}

function parseOptionalNumber(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: null };
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return { ok: false, error: `invalid ${fieldName}` };
  }
  return { ok: true, value: num };
}

function parseOptionalPeriod(value, fieldName) {
  const parsed = parseOptionalNumber(value, fieldName);
  if (!parsed.ok) return parsed;
  if (parsed.value === null) return parsed;
  if (!Number.isInteger(parsed.value)) {
    return { ok: false, error: `invalid ${fieldName}` };
  }
  return parsed;
}

function sanitizeItem(item) {
  const copy = { ...item };
  delete copy.password;
  delete copy.passwordHash;
  return copy;
}

function parseObjectList(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: [] };
  }
  if (!Array.isArray(value)) {
    return { ok: false, error: `invalid ${fieldName}` };
  }
  if (value.length > MAX_LIST_LENGTH) {
    return { ok: false, error: `invalid ${fieldName}` };
  }

  const items = [];
  for (const item of value) {
    if (item === undefined || item === null || item === "") continue;
    if (typeof item !== "object" || Array.isArray(item)) {
      return { ok: false, error: `invalid ${fieldName}` };
    }
    items.push(sanitizeItem(item));
  }
  return { ok: true, value: items };
}

function normalizeProductId(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value).trim();
  if (!text) return null;
  const asNumber = Number(text);
  if (text !== "" && Number.isFinite(asNumber) && String(asNumber) === text) {
    return asNumber;
  }
  return text;
}

function parseProductIds(value) {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: [] };
  }
  if (!Array.isArray(value)) {
    return { ok: false, error: "invalid productIds" };
  }
  if (value.length > MAX_LIST_LENGTH) {
    return { ok: false, error: "invalid productIds" };
  }

  const ids = [];
  for (const item of value) {
    const id = normalizeProductId(item);
    if (id === null) continue;
    ids.push(id);
  }
  return { ok: true, value: uniqueIds(ids) };
}

function uniqueIds(ids) {
  const seen = new Set();
  const result = [];
  for (const id of ids) {
    const key = `${typeof id}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(id);
  }
  return result;
}

function collectProductIds(explicitIds, assetList, loanList) {
  if (explicitIds.length > 0) return explicitIds;

  const fromHoldings = [];
  for (const item of [...assetList, ...loanList]) {
    const id = normalizeProductId(item.productId);
    if (id === null) continue;
    fromHoldings.push(id);
  }
  return uniqueIds(fromHoldings);
}

function parseSignupDto(body) {
  const root = asObject(body);
  const profile = asObject(root.profile);
  const financial = asObject(root.financial);
  const goal = asObject(root.goal);

  const loginId = firstTrimmed(
    root.loginId,
    root.userId,
    profile.loginId,
    profile.userId
  );
  const password = firstPassword(root.password, profile.password);
  const email = firstTrimmed(root.email, profile.email);
  const name = firstTrimmed(root.name, profile.name);

  if (!loginId) return { error: "loginId is required" };
  if (!password) return { error: "password is required" };
  if (!email) return { error: "email is required" };
  if (!name) return { error: "name is required" };

  if (!LOGIN_ID_RE.test(loginId)) return { error: "invalid loginId" };
  if (!isValidPassword(password)) return { error: "invalid password" };
  if (!EMAIL_RE.test(email)) return { error: "invalid email" };
  if (name.length > MAX_NAME_LENGTH) return { error: "invalid name" };

  const monthlyIncome = parseOptionalNumber(
    firstDefined(
      root.monthlyIncome,
      financial.monthlyIncome,
      financial.monthlySalary
    ),
    "monthlyIncome"
  );
  if (!monthlyIncome.ok) return { error: monthlyIncome.error };

  const targetAmount = parseOptionalNumber(
    firstDefined(root.targetAmount, goal.targetAmount, financial.targetAmount),
    "targetAmount"
  );
  if (!targetAmount.ok) return { error: targetAmount.error };

  const targetPeriod = parseOptionalPeriod(
    firstDefined(
      root.targetPeriod,
      goal.targetPeriod,
      goal.targetMonths,
      financial.targetPeriod
    ),
    "targetPeriod"
  );
  if (!targetPeriod.ok) return { error: targetPeriod.error };

  const assetList = parseObjectList(
    firstDefined(root.assetList, financial.assetList, financial.assets),
    "assetList"
  );
  if (!assetList.ok) return { error: assetList.error };

  const loanList = parseObjectList(
    firstDefined(root.loanList, financial.loanList, financial.loans),
    "loanList"
  );
  if (!loanList.ok) return { error: loanList.error };

  const productIds = parseProductIds(
    firstDefined(root.productIds, financial.productIds)
  );
  if (!productIds.ok) return { error: productIds.error };

  return {
    data: {
      loginId,
      password,
      email,
      name,
      monthlyIncome: monthlyIncome.value,
      targetAmount: targetAmount.value,
      targetPeriod: targetPeriod.value,
      assetList: assetList.value,
      loanList: loanList.value,
      productIds: collectProductIds(
        productIds.value,
        assetList.value,
        loanList.value
      ),
    },
  };
}

module.exports = {
  parseSignupDto,
};
