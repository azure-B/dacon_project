const { debtAdjustmentModel } = require("../models");

async function analyze(req, res) {
  try {
    const note = req.body?.note ?? req.body?.question ?? "";
    const result = await debtAdjustmentModel.analyze(req.user, { note });
    return res.json(result);
  } catch (error) {
    if (error.code === "AI_UNAVAILABLE") {
      return res.status(502).json({ error: "ai unavailable" });
    }
    return res.status(500).json({ error: "debt adjustment failed" });
  }
}

module.exports = {
  analyze,
};
