const { simulationModel } = require("../models");
const { getPreferredApiKey } = require("../config");

async function run(req, res) {
  const prompt = String(req.body?.prompt || req.body?.question || "").trim();
  const scenario = String(req.body?.scenario || "custom").trim() || "custom";
  const range = String(req.body?.range || "5y").trim() || "5y";

  try {
    const result = await simulationModel.run({
      user: req.user,
      prompt,
      scenario,
      range,
      apiKey: getPreferredApiKey(),
    });
    return res.json(result);
  } catch (error) {
    if (error.code === "AI_UNAVAILABLE") {
      return res.status(502).json({ error: "ai unavailable" });
    }
    return res.status(500).json({ error: "simulation failed" });
  }
}

module.exports = {
  run,
};
