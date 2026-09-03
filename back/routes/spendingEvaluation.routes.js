const express = require("express");
const { spendingEvaluationController } = require("../controller");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.get("/", requireAuth, spendingEvaluationController.list);
router.post("/run", requireAuth, spendingEvaluationController.run);

module.exports = router;
