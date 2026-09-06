const { healthModel } = require("../models");

async function getHealth(_req, res) {
  try {
    const status = await healthModel.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || "health failed" });
  }
}

module.exports = {
  getHealth,
};
