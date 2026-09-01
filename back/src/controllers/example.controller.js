const ExampleModel = require('../models/example.model');

const ExampleController = {
  getAll(_req, res, next) {
    try {
      const items = ExampleModel.findAll();
      res.json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  },

  getById(req, res, next) {
    try {
      const item = ExampleModel.findById(req.params.id);
      if (!item) {
        const error = new Error('Item not found');
        error.statusCode = 404;
        throw error;
      }
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  },

  create(req, res, next) {
    try {
      const item = ExampleModel.create(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = ExampleController;
