const { PERIODS } = require("../config");
const { spendingEvaluationModel } = require("../models");

function readPeriod(value) {
  const period = String(value || "").toLowerCase();
  if ([PERIODS.DAILY, PERIODS.WEEKLY, PERIODS.MONTHLY].includes(period)) {
    return period;
  }
  return "";
}

async function run(req, res) {
  const period = readPeriod(req.body?.period);
  if (!period) {
    return res.status(400).json({ error: "invalid period" });
  }

  try {
    const result = await spendingEvaluationModel.evaluateUserPeriod(req.user, period);
    return res.json(result);
  } catch (error) {
    if (error.code === "AI_UNAVAILABLE") {
      return res.status(502).json({ error: "ai unavailable" });
    }
    return res.status(500).json({ error: "spending evaluation failed" });
  }
}

function list(req, res) {
  const period = readPeriod(req.query?.period);
  const result = spendingEvaluationModel.getLatest(req.user.id, period || null);
  if (period && !result) {
    return res.status(404).json({ error: "evaluation not found" });
  }
  return res.json({ evaluations: Array.isArray(result) ? result : result ? [result] : [] });
}

module.exports = {
  run,
  list,
};
