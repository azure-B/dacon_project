const express = require("express");
const healthRoutes = require("./health.routes");
const itemRoutes = require("./item.routes");
const authRoutes = require("./auth.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/items", itemRoutes);
router.use("/auth", authRoutes);

module.exports = router;
