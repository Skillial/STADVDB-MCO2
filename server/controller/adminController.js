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
const admin = {

    render: (req, res) => {
        try {
            res.render('admin');
        } catch (error) {
            console.error(error);
        }
    },

    status: async (req, res) => {
        let results = [];
        for (let i = 0; i < DB_PORTS.length; i++) {
            let connection = createConnection(DB_PORTS[i]);
            try {
                await new Promise((resolve, reject) => {
                    connection.connect(err => {
                        if (err) {
                            results.push(1);
                        } else {
                            results.push(0);
                        }
                        resolve();
                    });
                });
            } catch (error) {
                console.error(error);
            }
            connection.end()
        }
        try {
            res.json(results);
        } catch (error) { 
            console.error(error);
        }
    }

}

module.exports = admin;