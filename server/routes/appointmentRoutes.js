const express = require('express');
const router = express.Router();
const controller = require('../controller/appointmentController.js');

router.get('/appointment', controller.render);

module.exports = router;