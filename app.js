require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.set("view engine", "ejs")

const mainRouter = require('./server/routes/mainRoutes')
app.use('/', mainRouter);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
  console.log(`Server running on http://localhost:${PORT}`);
});