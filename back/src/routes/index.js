const express = require('express');
const exampleRoutes = require('./example.routes');

const router = express.Router();

router.use('/examples', exampleRoutes);

module.exports = router;
