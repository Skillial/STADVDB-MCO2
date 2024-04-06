const express = require('express');
const router = express.Router();
const controller = require('../controller/adminController.js');

router.get('/admin', controller.render);
router.get('/status', controller.status);
router.get('/mode', controller.mode);

module.exports = router;