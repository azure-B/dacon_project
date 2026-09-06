const express = require("express");
const { simulationController } = require("../controller");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.post("/", requireAuth, simulationController.run);

module.exports = router;
