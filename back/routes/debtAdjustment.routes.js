const express = require("express");
const { debtAdjustmentController } = require("../controller");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.post("/", requireAuth, debtAdjustmentController.analyze);

module.exports = router;
