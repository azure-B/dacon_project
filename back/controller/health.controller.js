const { healthModel } = require("../models");

function getHealth(req, res) {
  const status = healthModel.getStatus();
  res.json(status);
}

module.exports = {
  getHealth,
};
