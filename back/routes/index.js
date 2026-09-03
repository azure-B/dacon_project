const express = require("express");
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const debtAdjustmentRoutes = require("./debtAdjustment.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/debt-adjustment", debtAdjustmentRoutes);

module.exports = router;
