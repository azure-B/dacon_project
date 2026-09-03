const { getPreferredApiKey } = require("../config");
const spamCheckService = require("../services/spamCheck.service");

async function check(req, res) {
  try {
    const result = await spamCheckService.analyze(req.body?.text, {
      apiKey: getPreferredApiKey(),
    });
    return res.json({
      isSpam: result.isSpam,
      spamProbability: result.spamProbability,
      message: result.message,
    });
  } catch (error) {
    if (error.code === "VALIDATION") {
      return res.status(error.status || 400).json({ error: error.message });
    }
    if (error.code === "AI_UNAVAILABLE") {
      return res.status(502).json({ error: "ai unavailable" });
    }
    return res.status(500).json({ error: "spam check failed" });
  }
}

module.exports = {
  check,
};
