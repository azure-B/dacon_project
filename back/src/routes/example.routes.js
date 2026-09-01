const express = require('express');
const ExampleController = require('../controllers/example.controller');

const router = express.Router();

router.get('/', ExampleController.getAll);
router.get('/:id', ExampleController.getById);
router.post('/', ExampleController.create);

module.exports = router;
