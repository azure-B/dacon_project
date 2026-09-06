const { accountBookModel } = require("../models");
const { parseCreateBody, parseUpdateBody, parseListQuery } = require("../dto/accountBook.dto");
const { aiConfig } = require("../config");

function defaultMonthFilter(filter) {
  if (filter.year != null || filter.from || filter.to) return filter;
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: aiConfig.evaluation.timezone || "Asia/Seoul",
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    ...filter,
    year: Number(map.year),
    month: Number(map.month),
  };
}

function handleDbError(res, error) {
  if (error?.code === "SUPABASE_NOT_CONFIGURED") {
    return res.status(503).json({ error: "supabase not configured" });
  }
  return res.status(500).json({ error: "account book failed" });
}

async function create(req, res) {
  const parsed = parseCreateBody(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }
  try {
    const item = await accountBookModel.create(
      req.user.id,
      parsed.data,
      req.accessToken
    );
    return res.status(201).json({ transaction: item });
  } catch (error) {
    return handleDbError(res, error);
  }
}

async function list(req, res) {
  const parsed = parseListQuery(req.query);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }
  try {
    const transactions = await accountBookModel.listByUser(
      req.user.id,
      parsed.data,
      req.accessToken
    );
    return res.json({
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    return handleDbError(res, error);
  }
}

async function update(req, res) {
  const parsed = parseUpdateBody(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }
  try {
    const item = await accountBookModel.update(
      req.params.id,
      req.user.id,
      parsed.data,
      req.accessToken
    );
    if (!item) {
      return res.status(404).json({ error: "transaction not found" });
    }
    return res.json({ transaction: item });
  } catch (error) {
    return handleDbError(res, error);
  }
}

async function remove(req, res) {
  try {
    const ok = await accountBookModel.remove(
      req.params.id,
      req.user.id,
      req.accessToken
    );
    if (!ok) {
      return res.status(404).json({ error: "transaction not found" });
    }
    return res.json({ ok: true });
  } catch (error) {
    return handleDbError(res, error);
  }
}

async function summary(req, res) {
  const parsed = parseListQuery(req.query);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }
  try {
    const filter = defaultMonthFilter(parsed.data);
    return res.json(
      await accountBookModel.summarize(req.user.id, filter, req.accessToken)
    );
  } catch (error) {
    return handleDbError(res, error);
  }
}

async function categorySummary(req, res) {
  const parsed = parseListQuery(req.query);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }
  try {
    const filter = defaultMonthFilter(parsed.data);
    return res.json(
      await accountBookModel.categorySummary(req.user.id, filter, req.accessToken)
    );
  } catch (error) {
    return handleDbError(res, error);
  }
}

module.exports = {
  create,
  list,
  update,
  remove,
  summary,
  categorySummary,
};
