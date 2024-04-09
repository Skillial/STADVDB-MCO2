const express = require('express');
const router = express.Router();
const controller = require('../controller/mainController.js');

const appointment = require('./appointmentRoutes.js');
const admin = require('./adminRoutes.js');

router.get('/', (req, res) => {
  res.redirect("/dashboard");
});

router.get('/dashboard', controller.render);
router.get('/fetchData/:region', controller.fetchData);

router.use('/', appointment);
router.use('/', admin);

module.exports = router;
