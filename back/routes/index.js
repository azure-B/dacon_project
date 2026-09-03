const express = require("express");
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const debtAdjustmentRoutes = require("./debtAdjustment.routes");
const spendingEvaluationRoutes = require("./spendingEvaluation.routes");
const accountBookRoutes = require("./accountBook.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/debt-adjustment", debtAdjustmentRoutes);
router.use("/spending-evaluations", spendingEvaluationRoutes);
router.use("/account-book", accountBookRoutes);

module.exports = router;
