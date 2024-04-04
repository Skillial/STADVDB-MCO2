const express = require('express');
const path = require('path');
const router = express.Router();
const parentDirectory = path.resolve(__dirname, '../../public/html');

router.get('/', (req, res) => {
  res.sendFile(path.join(parentDirectory, 'index.html'));
});

module.exports = router;
