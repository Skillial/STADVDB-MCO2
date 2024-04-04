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
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
    console.log(`Server running on http://localhost:${PORT}`);
});

function createConnection(port) {
    return mysql.createConnection({
      host: 'ccscloud.dlsu.edu.ph',
      user: 'root',
      database: 'distributed_database',
      port: port
    });
  }
  
  // Create connections
  const server0 = createConnection(20141);
  const server1 = createConnection(20142);
  const server2 = createConnection(20143);