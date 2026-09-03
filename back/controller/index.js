const healthController = require("./health.controller");
const authController = require("./auth.controller");
const debtAdjustmentController = require("./debtAdjustment.controller");
const spendingEvaluationController = require("./spendingEvaluation.controller");

module.exports = {
  healthController,
  authController,
  debtAdjustmentController,
  spendingEvaluationController,
};
