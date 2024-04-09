const { cookieChecker } = require('./../checker/cookie');
const { createConnection, DB_PORTS } = require('./../db/config');

const appointment = {

    render: (req, res) => {
        cookieChecker(req, res);
        try {
            res.render('appointment');
        } catch (error) {
            console.error(error);
        }
    },

    newRecord: (req, res) => {
        cookieChecker(req, res);
        try {
            res.render('newRecord');
        } catch (error) {
            console.error(error);
        }
    },

    insertRecord: async (req, res) => {
        const { id, startHour, Status, Type, Virtual, Hospital, City, Province, Region, Specialty, Age } = req.body;
        let centralConnection = createConnection(DB_PORTS[0]);
        let luzonError = 0;
        try {
            await new Promise((resolve) => {
                centralConnection.connect(err => {
                    if (err || req.cookies.Central == 2) {
                        luzonError = 1;
                        resolve();
                    }
                    let query = `INSERT INTO appointments (apptid, status, StartHour, type, \`Virtual\`, IsHospital, City, Province, RegionName, MainSpecialty, DoctorAge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    centralConnection.query(query, [id, Status, startHour, Type, Virtual, Hospital, City, Province, Region, Specialty, Age], (err, result) => {
                        if (err) {
                            console.error("Error inserting data:", err);
                            res.status(500).json({ message: "Error inserting data." });
                            return;
                        }
                        console.log("Data inserted successfully.");
                        res.json({ message: "Data inserted successfully." });
                    });
                    centralConnection.end(() => {
                        resolve();
                    });
                });
            });
        } catch (error) {
            console.error(error);
        }
    },

    searchAppID: async (req, res) => {
        const { appointmentId } = req.body;
        let centralConnection = createConnection(DB_PORTS[0]);
        let luzonError = 0;
        try {
            await new Promise((resolve) => {
                centralConnection.connect(err => {
                    if (err || req.cookies.Central == 2) {
                        luzonError = 1;
                        resolve();
                    }
                    let query = `SELECT * FROM appointments WHERE apptid = ?`;
                    centralConnection.query(query, [appointmentId], (err, results) => {
                        if (err) {
                            console.error("Error searching for appointment:", err);
                            res.status(500).json({ message: "Error searching for appointment." });
                            return;
                        }
                        res.json(results); // Return search results to the client
                    });
                });
            });
        } catch (error) {
            console.error(error);
        }
    },

    searchFilter: async (req, res) => {
        const filters = req.body;
        let query = "SELECT * FROM appointments WHERE ";
        const values = [];

        let isFirstCondition = true;

        Object.entries(filters).forEach(([key, value], index) => {
            if (value !== '') {
                if (!isFirstCondition) {
                    query += " AND ";
                }
                if (key === "Virtual") {
                    query += "\`Virtual\` = ?";
                } else {
                    query += `${key} = ?`;
                }
                values.push(value);
                isFirstCondition = false;
            }
        });

        let centralConnection = createConnection(DB_PORTS[0]);
        let luzonError = 0;
        try {
            await new Promise((resolve) => {
                centralConnection.connect(err => {
                    if (err || req.cookies.Central == 2) {
                        luzonError = 1;
                        resolve();
                    }
                    centralConnection.query(query, values, (err, results) => {
                        if (err) {
                            console.error("Error searching:", err);
                            res.status(500).json({ message: "Error searching." });
                            return;
                        }
                        res.json(results); // Return search results to the client
                    });
                });
            });
        } catch (error) {
            console.error(error);
        }
    },

    deleteRow: async (req, res) => {
        const appointmentId = req.params.id;

        const centralConnection = createConnection(DB_PORTS[0]);
        let luzonError = 0;
    
        try {
            await new Promise((resolve) => {
                centralConnection.connect(err => {
                    if (err || req.cookies.Central == 2) {
                        luzonError = 1;
                        resolve();
                    }

                    const query = `DELETE FROM appointments WHERE apptid = ?`;
                    centralConnection.query(query, appointmentId, (err, result) => {
                        if (err) {
                            console.error("Error deleting row:", err);
                            res.status(500).json({ message: "Error deleting row." });
                            return;
                        }
                        console.log("Row deleted successfully.");
                        res.json({ message: "Row deleted successfully." });
                    });
    
                    centralConnection.end(() => {
                        resolve();
                    });
                });
            });
        } catch (error) {
            console.error(error);
        }
    },

    editRecord: async (req, res) => {
        const appointmentId = req.params.id;
        
        let centralConnection = createConnection(DB_PORTS[0]);
        let luzonError = 0;
        try {
            await new Promise((resolve) => {
                centralConnection.connect(err => {
                    if (err || req.cookies.Central == 2) {
                        luzonError = 1;
                        resolve();
                    }
                    let query = `SELECT * FROM appointments WHERE apptid = ?`;
                    centralConnection.query(query, [appointmentId], (err, results) => {
                        if (err) {
                            console.error("Error searching for appointment:", err);
                            res.status(500).json({ message: "Error searching for appointment." });
                            return;
                        }
                        res.render('editRecord', {data: results[0]});
                    });
                });
            });
        } catch (error) {
            console.error(error);
        }
    },

    updateRecord: async (req, res) => {
        const { id, startHour, Status, Type, Virtual, Hospital, City, Province, Region, Specialty, Age } = req.body;

        let centralConnection = createConnection(DB_PORTS[0]);
        let luzonError = 0;
        try {
            await new Promise((resolve) => {
                centralConnection.connect(err => {
                    if (err || req.cookies.Central == 2) {
                        luzonError = 1;
                        resolve();
                    }
                    let query = `UPDATE appointments SET status = ?, StartHour = ?, type = ?, \`Virtual\` = ?, IsHospital = ?, City = ?, Province = ?, RegionName = ?, MainSpecialty = ?, DoctorAge = ? WHERE apptid = ?`;
                    centralConnection.query(query, [Status, startHour, Type, Virtual, Hospital, City, Province, Region, Specialty, Age, id], (err, result) => {
                        if (err) {
                            console.error('Failed to update row:', err);
                            res.status(500).json({ error: 'Failed to update row' });
                            return;
                        }
                        console.log('Row updated successfully');
                        res.json({ message: 'Row updated successfully' });
                    });
                    centralConnection.end(() => {
                        resolve();
                    });
                });
            });
        } catch (error) {
            console.error(error);
        }
    },
}

module.exports = appointment;