const express = require('express');
const router = express.Router();
const path = require('path');
let parentDIR = path.dirname(__filename);
parentDIR = path.dirname(parentDIR);
parentDIR = path.dirname(parentDIR);

// Route
router.get('/', (req, res) => {
    res.redirect('html/index.html');
}
);