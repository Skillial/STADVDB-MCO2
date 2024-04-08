const express = require('express');
const router = express.Router();
const controller = require('../controller/adminController.js');

router.get('/admin', controller.render);
router.get('/admin/status', controller.status);
router.get('/admin/hide/:type', controller.hide);
router.get('/admin/mode', controller.mode);

module.exports = router;