const { itemModel } = require("../models");

function parseId(req) {
  return Number(req.params.id);
}

function getItems(req, res) {
  res.json({
    count: itemModel.findAll().length,
    items: itemModel.findAll(),
  });
}

function getItem(req, res) {
  const item = itemModel.findById(parseId(req));
  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }
  res.json(item);
}

function createItem(req, res) {
  const title = String(req.body?.title || "").trim();
  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }

  const item = itemModel.create({
    title,
    done: req.body.done,
  });
  res.status(201).json(item);
}

function replaceItem(req, res) {
  const title = String(req.body?.title || "").trim();
  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }

  const item = itemModel.replace(parseId(req), {
    title,
    done: req.body.done,
  });
  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }
  res.json(item);
}

function patchItem(req, res) {
  const item = itemModel.update(parseId(req), req.body || {});
  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }
  res.json(item);
}

function deleteItem(req, res) {
  const item = itemModel.remove(parseId(req));
  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }
  res.json({ deleted: true, item });
}

module.exports = {
  getItems,
  getItem,
  createItem,
  replaceItem,
  patchItem,
  deleteItem,
};
