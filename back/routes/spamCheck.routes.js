const express = require("express");
const { spamCheckController } = require("../controller");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.post("/", requireAuth, spamCheckController.check);

module.exports = router;
