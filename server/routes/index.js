const express = require("express");
const healthRoutes = require("./health.routes");
const itemRoutes = require("./item.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/items", itemRoutes);

module.exports = router;
