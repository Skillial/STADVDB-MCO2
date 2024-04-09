const { cookieChecker } = require('./../checker/cookie');
const { createConnection, DB_PORTS } = require('./../db/config');
const { LUZON, VISAYAS, MINDANAO } = require('./../db/region');

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
        let centralError = 0, fragError = 0, nodeToInsert = -1;
        async function insertCentral() {
            let centralConnection = createConnection(DB_PORTS[0]);
            try {
                await new Promise((resolve) => {
                    centralConnection.connect(err => {
                        if (err || req.cookies.Central == 2) {
                            centralError = 1;
                            resolve();
                        }
                        let query = `INSERT INTO appointments (apptid, status, StartHour, type, \`Virtual\`, IsHospital, City, Province, RegionName, MainSpecialty, DoctorAge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                        centralConnection.query(query, [id, Status, startHour, Type, Virtual, Hospital, City, Province, Region, Specialty, Age], (err, result) => {
                            if (err) {
                                console.error("Error inserting data:", err);
                                centralError = 1;
                                resolve();
                            }
                            console.log("Data inserted successfully.");
                        });
                        centralConnection.end(() => {
                            resolve();
                        });
                    });
                });
            } catch (error) {
                console.error(error);
            }
        }

        async function insertFrag() {
            let fragConnection, hidden;
            if (LUZON.includes(Region)) {
                fragConnection = createConnection(DB_PORTS[1]);
                hidden = req.cookies.Luz;
                nodeToInsert = 1;
            } else {
                fragConnection = createConnection(DB_PORTS[2]);
                hidden = req.cookies.VisMin;
                nodeToInsert = 2;
            }
            try {
                await new Promise((resolve) => {
                    fragConnection.connect(err => {
                        if (err || hidden == 2) {
                            fragError = 1;
                            resolve();
                        }
                        let query = `INSERT INTO appointments (apptid, status, StartHour, type, \`Virtual\`, IsHospital, City, Province, RegionName, MainSpecialty, DoctorAge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                        fragConnection.query(query, [id, Status, startHour, Type, Virtual, Hospital, City, Province, Region, Specialty, Age], (err, result) => {
                            if (err) {
                                console.error("Error inserting data:", err);
                                fragError = 1;
                            }
                            console.log("Data inserted successfully.");

                        });
                        fragConnection.end(() => {
                            resolve();
                        });
                    });
                });
            } catch (error) {
                console.error(error);
            }
        }
        await insertCentral();
        await insertFrag();
        if (centralError == 1 && fragError == 1) {
            return res.status(500).json({ message: "Error inserting data." });
        } else if (centralError == 1) {
            // add to frag log
        } else if (fragError == 1) {
            // add to central log
        }
        res.json({ message: "Data inserted successfully." });

    },

    searchAppID: async (req, res) => {
        const { appointmentId } = req.body;
        let centralError = 0, fragError = 0;

        async function searchCentral() {
            let centralConnection = createConnection(DB_PORTS[0]);
            let totalResults = [];
            try {
                await new Promise((resolve) => {
                    centralConnection.connect(err => {
                        if (err || req.cookies.Central == 2) {
                            centralError = 1;
                            resolve();
                        }
                        let query = `SELECT * FROM appointments WHERE apptid REGEXP ?`;
                        centralConnection.query(query, [appointmentId], (err, results) => {
                            if (err) {
                                console.error("Error searching for appointment:", err);
                                centralError = 1;
                                resolve();
                            }
                            for (let key in results) {
                                if (results.hasOwnProperty(key)) {
                                    totalResults.push(results[key]);
                                }
                            }
                            resolve();
                        });
                    });
                });
            } catch (error) {
                console.error(error);
            }
            return totalResults;
        }

        async function searchFrag() {
            let totalResults = [];
            for (let i = 1; i < 3; i++) {
                let cookie;
                if (i == 1) {
                    cookie = req.cookies.Luz;
                } else {
                    cookie = req.cookies.VisMin;
                }
                let connection = createConnection(DB_PORTS[i]);
                try {
                    await new Promise((resolve) => {
                        connection.connect(err => {
                            if (err || cookie == 2) {
                                fragError = 1;
                                resolve();
                            }

                            let query = `SELECT * FROM appointments WHERE apptid REGEXP ?`;
                            connection.query(query, [appointmentId], (err, results) => {
                                if (err) {
                                    console.error("Error searching for appointment:", err);
                                    fragError = 1;
                                    resolve();
                                }
                                for (let key in results) {
                                    if (results.hasOwnProperty(key)) {
                                        totalResults.push(results[key]);
                                    }
                                }
                                resolve();
                            });
                        });
                    });
                } catch (error) {
                    console.error(error);
                }
            }
            return totalResults
        }
        let results = []
        if (req.cookies.mode == 1) {
            results = await searchCentral();
            if (centralError == 1) {
                results = await searchFrag();
            }
        } else {
            results = await searchFrag();
            if (fragError == 1) {
                let newResults = await searchCentral();
                if (centralError == 0) {
                    results = newResults;
                }
            }
        }
        if (fragError == 1 && centralError == 1 && results.length == 0) {
            return res.status(500).json({ message: "Error searching for appointment." });
        }
        res.json(results);
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
        let centralError = 0, fragError = 0;

        async function centralFilter() {
            let centralConnection = createConnection(DB_PORTS[0]);
            let totalResults = [];
            try {
                await new Promise((resolve) => {
                    centralConnection.connect(err => {
                        if (err || req.cookies.Central == 2) {
                            centralError = 1;
                            resolve();
                        }
                        centralConnection.query(query, values, (err, results) => {
                            if (err) {
                                console.error("Error searching:", err);
                                centralError = 1;
                                resolve();
                            }
                            for (let key in results) {
                                if (results.hasOwnProperty(key)) {
                                    totalResults.push(results[key]);
                                }
                            }
                            resolve();
                        });
                    });
                });
            } catch (error) {
                console.error(error);
            }
            return totalResults;
        }

        async function fragFilter() {
            let totalResults = [];
            for (let i = 1; i < 3; i++) {
                let connection = createConnection(DB_PORTS[i]);
                if (i == 1) {
                    cookie = req.cookies.Luz;
                } else {
                    cookie = req.cookies.VisMin;
                }
                try {
                    await new Promise((resolve) => {
                        connection.connect(err => {
                            if (err || cookie == 2) {
                                fragError = 1;
                                resolve();
                            }
                            connection.query(query, values, (err, results) => {
                                if (err) {
                                    console.error("Error searching:", err);
                                    fragError = 1;
                                    resolve();
                                }
                                for (let key in results) {
                                    if (results.hasOwnProperty(key)) {
                                        totalResults.push(results[key]);
                                    }
                                }
                                resolve();
                            });
                        });
                    });


                } catch (error) {
                    console.error(error);
                }
            }
            return totalResults;
        }
        let results = []
        if (req.cookies.mode == 1) {
            results = await centralFilter();
            if (centralError == 1) {
                results = await fragFilter();
            }
        } else {
            results = await fragFilter();
            if (fragError == 1) {
                let newResults = await centralFilter();
                if (centralError == 0) {
                    results = newResults;
                }
            }
        }
        if (fragError == 1 && centralError == 1 && results.length == 0) {
            return res.status(500).json({ message: "Error searching." });
        }
        res.json(results);
    },

    deleteRow: async (req, res) => {
        const appointmentId = req.params.id;
        const RegionName = req.params.RegionName;
        let centralError = 0, fragError = 0;

        async function deleteCentral() {
            const centralConnection = createConnection(DB_PORTS[0]);
            try {
                await new Promise((resolve) => {
                    centralConnection.connect(err => {
                        if (err || req.cookies.Central == 2) {
                            centralError = 1;
                            resolve();
                        }
                        const query = `DELETE FROM appointments WHERE apptid = ?`;
                        centralConnection.query(query, appointmentId, (err, result) => {
                            if (err) {
                                console.error("Error deleting row:", err);
                                centralError = 1;
                                resolve();
                            }
                            console.log("Row deleted successfully.");
                        });

                        centralConnection.end(() => {
                            resolve();
                        });
                    });
                });
            } catch (error) {
                console.error(error);
            }
        }

        async function deleteFrag() {
            let connection, hidden, nodetoDelete;
            if (LUZON.includes(RegionName)) {
                connection = createConnection(DB_PORTS[1]);
                hidden = req.cookies.Luz;
                nodetoDelete = 1;
            } else {
                connection = createConnection(DB_PORTS[2]);
                hidden = req.cookies.VisMin;
                nodetoDelete = 2;
            }
            try {
                await new Promise((resolve) => {
                    connection.connect(err => {
                        if (err || hidden == 2) {
                            fragError = 1;
                            resolve();
                        }
                        const query = `DELETE FROM appointments WHERE apptid = ?`;
                        connection.query(query, appointmentId, (err, result) => {
                            if (err) {
                                console.error("Error deleting row:", err);
                                centralError = 1;
                                resolve();
                            }
                            console.log("Row deleted successfully.");
                        });

                        connection.end(() => {
                            resolve();
                        });
                    });
                });
            } catch (error) {
                console.error(error);
            }
        }
        await deleteCentral();
        await deleteFrag();
        if (centralError == 1 && fragError == 1) {
            return res.status(500).json({ message: "Error deleting row." });
        } else if (centralError == 1) {
            // add to frag log
        } else if (fragError == 1) {
            // add to central log
        }
        res.json({ message: "Row deleted successfully." });

    },

    editRecord: async (req, res) => {
        const appointmentId = req.params.id;
        const RegionName = req.params.RegionName;
        let centralError = 0, fragError = 0;
        let totalResults = [];

        async function centralRecord() {
            let centralConnection = createConnection(DB_PORTS[0]);
            try {
                await new Promise((resolve) => {
                    centralConnection.connect(err => {
                        if (err || req.cookies.Central == 2) {
                            centralError = 1;
                            resolve();
                        }
                        let query = `SELECT * FROM appointments WHERE apptid = ?`;
                        centralConnection.query(query, [appointmentId], (err, results) => {
                            if (err) {
                                console.error("Error searching for appointment:", err);
                                centralError = 1;
                                resolve();
                            }
                            for (let key in results) {
                                if (results.hasOwnProperty(key)) {
                                    totalResults.push(results[key]);
                                }
                            }
                            resolve();
                        });
                    });
                });
            } catch (error) {
                console.error(error);
            }
        }

        async function fragRecord() {

            let connection, hidden;
            if (LUZON.includes(RegionName)) {
                connection = createConnection(DB_PORTS[1]);
                hidden = req.cookies.Luz;
            } else {
                connection = createConnection(DB_PORTS[2]);
                hidden = req.cookies.VisMin;
            }
            try {
                await new Promise((resolve) => {
                    connection.connect(err => {
                        if (err || hidden == 2) {
                            fragError = 1;
                            resolve();
                        }
                        let query = `SELECT * FROM appointments WHERE apptid = ?`;
                        connection.query(query, [appointmentId], (err, results) => {
                            if (err) {
                                console.error("Error searching for appointment:", err);
                                fragError = 1;
                                resolve();
                            }
                            for (let key in results) {
                                if (results.hasOwnProperty(key)) {
                                    totalResults.push(results[key]);
                                }
                            }
                            resolve();
                        });
                    });
                });
            } catch (error) {
                console.error(error);
            }
        }

        await centralRecord();
        if (centralError == 1) {
            await fragRecord();
            if (fragError == 1) {
                return res.status(500).json({ message: "Error searching for appointment." });
            }
        }
        res.render('editRecord', { data: totalResults[0] });

    },

    updateRecord: async (req, res) => {
        const { id, startHour, Status, Type, Virtual, Hospital, City, Province, Region, Specialty, Age } = req.body;
        let centralError = 0, fragError = 0;

        async function updateCentral() {
            let centralConnection = createConnection(DB_PORTS[0]);
            try {
                await new Promise((resolve) => {
                    centralConnection.connect(err => {
                        if (err || req.cookies.Central == 2) {
                            centralError = 1;
                            resolve();
                        }
                        let query = `UPDATE appointments SET status = ?, StartHour = ?, type = ?, \`Virtual\` = ?, IsHospital = ?, City = ?, Province = ?, RegionName = ?, MainSpecialty = ?, DoctorAge = ? WHERE apptid = ?`;
                        centralConnection.query(query, [Status, startHour, Type, Virtual, Hospital, City, Province, Region, Specialty, Age, id], (err, result) => {
                            if (err) {
                                console.error('Failed to update row:', err);
                                centralError = 1;
                            }
                            console.log('Row updated successfully');
                        });
                        centralConnection.end(() => {
                            resolve();
                        });
                    });
                });
            } catch (error) {
                console.error(error);
            }
        }

        async function updateFrag() {
            let connection, hidden, nodetoUpdate;
            if (LUZON.includes(Region)) {
                connection = createConnection(DB_PORTS[1]);
                hidden = req.cookies.Luz;
                nodetoUpdate = 1
            } else {
                connection = createConnection(DB_PORTS[2]);
                hidden = req.cookies.VisMin;
                nodetoUpdate = 2;
            }
            try {
                await new Promise((resolve) => {
                    connection.connect(err => {
                        if (err || hidden == 2) {
                            fragError = 1;
                            resolve();
                        }
                        let query = `UPDATE appointments SET status = ?, StartHour = ?, type = ?, \`Virtual\` = ?, IsHospital = ?, City = ?, Province = ?, RegionName = ?, MainSpecialty = ?, DoctorAge = ? WHERE apptid = ?`;
                        connection.query(query, [Status, startHour, Type, Virtual, Hospital, City, Province, Region, Specialty, Age, id], (err, result) => {
                            if (err) {
                                console.error('Failed to update row:', err);
                                fragError = 1;
                            }
                            console.log('Row updated successfully');
                        });
                        connection.end(() => {
                            resolve();
                        });
                    });
                });
            } catch (error) {
                console.error(error);
            }
        }
        await updateCentral();
        await updateFrag();
        if (centralError == 1 && fragError == 1) {
            return res.status(500).json({ error: 'Failed to update row' });
        } else if (centralError == 1) {
            // add to frag log
        } else if (fragError == 1) {
            // add to central log
        }
        res.json({ message: 'Row updated successfully' });

    }

}

module.exports = appointment;