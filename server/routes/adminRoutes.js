const express = require('express');
const router = express.Router();
const controller = require('../controller/adminController.js');

router.get('/admin', controller.render);
router.get('/status', controller.status);

module.exports = router;