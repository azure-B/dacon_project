const express = require("express");
const { itemController } = require("../controller");

const router = express.Router();

router.get("/", itemController.getItems);
router.get("/:id", itemController.getItem);
router.post("/", itemController.createItem);
router.put("/:id", itemController.replaceItem);
router.patch("/:id", itemController.patchItem);
router.delete("/:id", itemController.deleteItem);

module.exports = router;
