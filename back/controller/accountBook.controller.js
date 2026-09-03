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

function create(req, res) {
  const parsed = parseCreateBody(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }
  const item = accountBookModel.create(req.user.id, parsed.data);
  return res.status(201).json({ transaction: item });
}

function list(req, res) {
  const parsed = parseListQuery(req.query);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }
  const transactions = accountBookModel.listByUser(req.user.id, parsed.data);
  return res.json({
    count: transactions.length,
    transactions,
  });
}

function update(req, res) {
  const parsed = parseUpdateBody(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }
  const item = accountBookModel.update(req.params.id, req.user.id, parsed.data);
  if (!item) {
    return res.status(404).json({ error: "transaction not found" });
  }
  return res.json({ transaction: item });
}

function remove(req, res) {
  const ok = accountBookModel.remove(req.params.id, req.user.id);
  if (!ok) {
    return res.status(404).json({ error: "transaction not found" });
  }
  return res.json({ ok: true });
}

function summary(req, res) {
  const parsed = parseListQuery(req.query);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }
  const filter = defaultMonthFilter(parsed.data);
  return res.json(accountBookModel.summarize(req.user.id, filter));
}

function categorySummary(req, res) {
  const parsed = parseListQuery(req.query);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }
  const filter = defaultMonthFilter(parsed.data);
  return res.json(accountBookModel.categorySummary(req.user.id, filter));
}

module.exports = {
  create,
  list,
  update,
  remove,
  summary,
  categorySummary,
};
