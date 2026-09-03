const express = require("express");
const { accountBookController } = require("../controller");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

router.get("/summary", accountBookController.summary);
router.get("/category-summary", accountBookController.categorySummary);
router.get("/", accountBookController.list);
router.post("/", accountBookController.create);
router.put("/:id", accountBookController.update);
router.patch("/:id", accountBookController.update);
router.delete("/:id", accountBookController.remove);

module.exports = router;
