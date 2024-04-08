require('dotenv').config();
const mysql = require('mysql');

const DB_PORT_1 = process.env.DB_PORT_1;
const DB_PORT_2 = process.env.DB_PORT_2;
const DB_PORT_3 = process.env.DB_PORT_3;
const DB_USER = process.env.DB_USER;
const DB_HOST = process.env.DB_HOST;
const DB_DATABASE = process.env.DB_DATABASE;
const DB_PORTS = [DB_PORT_1, DB_PORT_2, DB_PORT_3];

function createConnection(port) {
    return mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        database: DB_DATABASE,
        port: port
    });
}

module.exports = {
    DB_PORTS,
    createConnection
}