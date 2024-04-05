require('dotenv').config();
const express = require('express');
const path = require('path');
const mysql = require('mysql');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const mainRouter = require('./server/routes/main')
app.use('/', mainRouter);

const PORT = process.env.PORT;
const DB_PORT_1 = process.env.DB_PORT_1;
const DB_PORT_2 = process.env.DB_PORT_2;
const DB_PORT_3 = process.env.DB_PORT_3;
const DB_USER = process.env.DB_USER;
const DB_HOST = process.env.DB_HOST;
const DB_DATABASE = process.env.DB_DATABASE;


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
    console.log(`Server running on http://localhost:${PORT}`);
});

function createConnection(port) {
    return mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      database: DB_DATABASE,
      port: port
    });
  }
  
  // Create connections
  const server0 = createConnection(DB_PORT_1);
  const server1 = createConnection(DB_PORT_2);
  const server2 = createConnection(DB_PORT_3);