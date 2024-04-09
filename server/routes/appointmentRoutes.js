const express = require('express');
const router = express.Router();
const controller = require('../controller/appointmentController.js');

router.get('/appointment', controller.render);
router.get('/newRecord', controller.newRecord);
router.post('/insertRecord', controller.insertRecord);
router.post('/searchAppID', controller.searchAppID);
router.post('/searchFilter', controller.searchFilter);
router.delete('/deleteRow/:id', controller.deleteRow);
router.get('/editRecord/:id', controller.editRecord);
router.put('/updateRecord', controller.updateRecord);

module.exports = router;