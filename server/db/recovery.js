const { createConnection, DB_PORTS } = require('./../db/config');

function recovery() {
    for (let i = 0; i < 3; i++) {
        let connection = createConnection(DB_PORTS[i]);
        connection.connect(err => {
            if (err) {
                console.log(err);
                connection.end();
                return;
            }
            connection.query("LOCK TABLES appointment_log WRITE", (err, result) => {
                if (err) {
                    console.log(err);
                    connection.end();
                    return;
                }
            });
            let query = `SELECT MAX(ID) FROM appointment_log`;
            connection.query(query, (err, maxResult) => {
                if (err) {
                    console.log(err);
                    connection.end();
                    return;
                }
                let maxId = maxResult[0]['MAX(ID)'];
                if (maxId !== 0) {
                    let selectQuery = `SELECT * FROM appointment_log WHERE ID != 0`;
                    connection.query(selectQuery, (err, selectResult) => {
                        if (err) {
                            console.log(err);
                            connection.end();
                            return;
                        }
                        selectResult.forEach(item => {
                            let { apptid, status, StartHour, type, Virtual, IsHospital, City, Province, RegionName, MainSpecialty, DoctorAge, Query, Node, ID } = item;
                            let updateConnection = createConnection(DB_PORTS[Node]);
                            let sql;
                            let values;
                            if (Query === 'INSERT') {
                                sql = `INSERT INTO appointments (apptid, status, StartHour, type, \`Virtual\`, IsHospital, City, Province, RegionName, MainSpecialty, DoctorAge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                                values = [apptid, status, StartHour, type, Virtual, IsHospital, City, Province, RegionName, MainSpecialty, DoctorAge];
                            } else if (Query === 'UPDATE') {
                                sql = `UPDATE appointments SET status = ?, StartHour = ?, type = ?, \`Virtual\` = ?, IsHospital = ?, City = ?, Province = ?, RegionName = ?, MainSpecialty = ?, DoctorAge = ? WHERE apptid = ?`;
                                values = [status, StartHour, type, Virtual, IsHospital, City, Province, RegionName, MainSpecialty, DoctorAge, apptid];
                            } else if (Query === 'DELETE') {
                                sql = `DELETE FROM appointments WHERE apptid = ?`;
                                values = [apptid];
                            }
                            updateConnection.connect(err => {
                                if (err) {
                                    console.log(err);
                                    updateConnection.end();
                                    return;
                                }
                                updateConnection.query(sql, values, (err, result) => {
                                    if (err) {
                                        console.log(err);
                                        updateConnection.end();
                                        return;
                                    }
                                    console.log("Updated to DB");
                                    updateConnection.end();
                                    connection.query(`DELETE FROM appointment_log WHERE ID = ?`, [ID], (err, result) => {
                                        if (err) {
                                            console.log(err);
                                            connection.end();
                                            return;
                                        }
                                        console.log("Deleted from log");
                                        connection.end();
                                    });
                                });
                            });
                        });
                    });
                }

            });
            connection.query("UNLOCK TABLES", (err, result) => {
                if (err) {
                    console.log(err);
                    connection.end();
                    return;
                }
            });
        });
    }
}

module.exports = { recovery };