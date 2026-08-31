const express = require("express");
const { healthController } = require("../controller");

const router = express.Router();

router.get("/", healthController.getHealth);

module.exports = router;
