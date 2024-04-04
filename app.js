const path = require('path');

const express = require('express');
const expressLayout = require('express-ejs-layouts');
const router = require('./server/routes/main.js');

const { connect } = require('http2');

const app = express();
const PORT = process.env.PORT;

app.use(express.static(__dirname + '/public'));
app.use(expressLayout);

app.use(express.json());
app.set('layout', './layouts/main');

app.use('/', require('./server/routes/main.js'));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
    console.log(`Server running on http://localhost:${PORT}`);
}
);