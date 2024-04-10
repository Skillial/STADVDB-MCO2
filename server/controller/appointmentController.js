const { cookieChecker } = require('./../checker/cookie');
const { createConnection, DB_PORTS } = require('./../db/config');
const { LUZON, VISAYAS, MINDANAO } = require('./../db/region');
const { recovery } = require('./../db/recovery');

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
                            centralConnection.end(() => {
                                resolve();
                            });
                            return;
                        }
                        centralConnection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE', (err) => {
                            if (err) {
                                console.error("Error setting isolation level:", err);
                                centralError = 1;
                                centralConnection.end(() => {
                                    resolve();
                                });
                                return;
                            }
                            centralConnection.beginTransaction((err) => {

                                if (err) {
                                    centralConnection.rollback();
                                    console.error("Error starting transaction:", err);
                                    centralError = 1;
                                    centralConnection.end(() => {
                                        resolve();
                                    });
                                    return;
                                }
                                let query = `INSERT INTO appointments (apptid, status, StartHour, type, \`Virtual\`, IsHospital, City, Province, RegionName, MainSpecialty, DoctorAge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                                centralConnection.query(query, [id, Status, startHour, Type, Virtual, Hospital, City, Province, Region, Specialty, Age], (err, result) => {
                                    if (err) {
                                        console.error("Error inserting data:", err);
                                        centralError = 1;
                                        centralConnection.rollback();
                                        centralConnection.end(() => {
                                            resolve();
                                        });
                                        return;
                                    }
                                    console.log("Data inserted successfully.");
                                    centralConnection.commit((err) => {
                                        if (err) {
                                            console.error("Error committing transaction:", err);
                                            centralError = 1;
                                            centralConnection.rollback();
                                            centralConnection.end(() => {
                                                resolve();
                                            });
                                            return;
                                        }
                                        centralConnection.end(() => {
                                            resolve();
                                        });
                                        return;
                                    });
                                });
                            });
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
                            fragConnection.end(() => {
                                resolve();
                            });
                            return;
                        }
                        fragConnection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE', (err) => {
                            if (err) {
                                fragConnection.end();
                                console.error("Error setting isolation level:", err);
                                fragError = 1;
                                resolve();
                                return;
                            }
                            fragConnection.beginTransaction((err) => {
                                if (err) {
                                    fragConnection.rollback();
                                    fragConnection.end();
                                    console.error("Error starting transaction:", err);
                                    fragError = 1;
                                    resolve();
                                    return;
                                }
                                let query = `INSERT INTO appointments (apptid, status, StartHour, type, \`Virtual\`, IsHospital, City, Province, RegionName, MainSpecialty, DoctorAge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                                fragConnection.query(query, [id, Status, startHour, Type, Virtual, Hospital, City, Province, Region, Specialty, Age], (err, result) => {
                                    if (err) {
                                        console.error("Error inserting data:", err);
                                        fragError = 1;
                                        fragConnection.rollback();
                                        fragConnection.end();
                                        resolve();
                                        return;
                                    }
                                    console.log("Data inserted successfully.");
                                    fragConnection.commit((err) => {
                                        if (err) {
                                            console.error("Error committing transaction:", err);
                                            fragError = 1;
                                            fragConnection.rollback();
                                            fragConnection.end();
                                            resolve();
                                            return;
                                        }
                                        fragConnection.end(() => {
                                            resolve();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            } catch (error) {
                console.error(error);
            }
        }
        recovery();
        if (req.cookies.mode == 1) {
            await insertCentral();
            await insertFrag();
        } else {
            await insertFrag();
            await insertCentral();
        }
        if (centralError == 1 && fragError == 1) {
            return res.status(500).json({ message: "Error inserting data." });
        } else if (centralError == 1) {
            // add to frag log

            let connection = createConnection(DB_PORTS[nodeToInsert]);
            connection.connect(err => {
                if (err) {
                    console.log(err);
                    connection.end();
                    return;
                }
                let idquery = `SELECT MAX(ID) FROM appointment_log`;
                let maxId;
                connection.query(idquery, (err, maxResult) => {
                    if (err) {
                        console.log(err);
                        connection.end();
                        return;
                    }
                    maxId = maxResult[0]['MAX(ID)'];
                    values = [id, Status, startHour, Type, Virtual, Hospital, City, Province, Region, Specialty, Age, "INSERT", "0", maxId + 1];
                    let query = `INSERT INTO appointment_log (apptid, status, StartHour, type, \`Virtual\`, IsHospital, City, Province, RegionName, MainSpecialty, DoctorAge, Query, Node, ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    connection.query(query, values, (err, result) => {
                        if (err) {
                            console.log(err);
                            connection.end();
                            return;
                        }
                        console.log("Inserted to log");
                        connection.end();
                    });
                });
            });
        } else if (fragError == 1) {
            // add to central log
            let connection = createConnection(DB_PORTS[0]);
            connection.connect(err => {
                if (err) {
                    console.log(err);
                    connection.end();
                    return;
                }
                let idquery = `SELECT MAX(ID) FROM appointment_log`;
                let maxId;
                connection.query(idquery, (err, maxResult) => {
                    if (err) {
                        console.log(err);
                        connection.end();
                        return;
                    }
                    maxId = maxResult[0]['MAX(ID)'];
                    values = [id, Status, startHour, Type, Virtual, Hospital, City, Province, Region, Specialty, Age, "INSERT", nodeToInsert.toString(), maxId + 1];
                    let query = `INSERT INTO appointment_log (apptid, status, StartHour, type, \`Virtual\`, IsHospital, City, Province, RegionName, MainSpecialty, DoctorAge, Query, Node, ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    connection.query(query, values, (err, result) => {
                        if (err) {
                            console.log(err);
                            connection.end();
                            return;
                        }
                        console.log("Inserted to log");
                        connection.end();
                    });
                });
            });
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
                            centralConnection.end(() => {
                                resolve();
                            });
                            return;
                        }
                        centralConnection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE', (err) => {
                            if (err) {
                                centralConnection.end();
                                console.error("Error setting isolation level:", err);
                                centralError = 1;
                                resolve();
                                return;
                            }
                            centralConnection.beginTransaction((err) => {
                                if (err) {
                                    centralConnection.rollback();
                                    centralConnection.end();
                                    console.error("Error starting transaction:", err);
                                    centralError = 1;
                                    resolve();
                                    return;
                                }
                                let query = `SELECT * FROM appointments WHERE apptid REGEXP ?`;
                                centralConnection.query(query, [appointmentId], (err, results) => {
                                    if (err) {
                                        console.error("Error searching for appointment:", err);
                                        centralError = 1;
                                        centralConnection.rollback();
                                        centralConnection.end();
                                        resolve();
                                        return;
                                    }
                                    for (let key in results) {
                                        if (results.hasOwnProperty(key)) {
                                            totalResults.push(results[key]);
                                        }
                                    }
                                    centralConnection.commit((err) => {
                                        if (err) {
                                            console.error("Error committing transaction:", err);
                                            centralError = 1;
                                            centralConnection.rollback();
                                            centralConnection.end();
                                            resolve();
                                            return;
                                        }
                                        centralConnection.end(() => {
                                            resolve();
                                        });
                                        return;
                                    });
                                });
                            });
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
                                connection.end(() => {
                                    resolve();
                                });
                                return;
                            }
                            connection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE', (err) => {
                                if (err) {
                                    connection.end();
                                    console.error("Error setting isolation level:", err);
                                    fragError = 1;
                                    resolve();
                                    return;
                                }
                                connection.beginTransaction((err) => {
                                    if (err) {
                                        connection.rollback();
                                        connection.end();
                                        console.error("Error starting transaction:", err);
                                        fragError = 1;
                                        resolve();
                                        return;
                                    }
                                    let query = `SELECT * FROM appointments WHERE apptid REGEXP ?`;
                                    connection.query(query, [appointmentId], (err, results) => {
                                        if (err) {
                                            console.error("Error searching for appointment:", err);
                                            fragError = 1;
                                            connection.rollback();
                                            connection.end();
                                            resolve();
                                            return;
                                        }
                                        for (let key in results) {
                                            if (results.hasOwnProperty(key)) {
                                                totalResults.push(results[key]);
                                            }
                                        }
                                        connection.commit((err) => {
                                            if (err) {
                                                console.error("Error committing transaction:", err);
                                                fragError = 1;
                                                connection.rollback();
                                                connection.end();
                                                resolve();
                                                return;
                                            }
                                            connection.end(() => {
                                                resolve();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                } catch (error) {
                    console.error(error);
                }
            }
            return totalResults
        }
        recovery();
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
                            centralConnection.end(() => {
                                resolve();
                            });
                            return;
                        }
                        centralConnection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE', (err) => {
                            if (err) {
                                centralConnection.end();
                                console.error("Error setting isolation level:", err);
                                centralError = 1;
                                resolve();
                                return;
                            }
                            centralConnection.beginTransaction({ isolationLevel: 'SERIALIZABLE' }, async (err) => {
                                if (err) {
                                    centralConnection.rollback();
                                    centralConnection.end();
                                    console.error("Error starting transaction:", err);
                                    centralError = 1;
                                    resolve();
                                    return;
                                }
                                centralConnection.query(query, values, (err, results) => {
                                    if (err) {
                                        console.error("Error searching:", err);
                                        centralError = 1;
                                        centralConnection.rollback();
                                        centralConnection.end();
                                        resolve();
                                        return;
                                    }
                                    for (let key in results) {
                                        if (results.hasOwnProperty(key)) {
                                            totalResults.push(results[key]);
                                        }
                                    }
                                    centralConnection.commit((err) => {
                                        if (err) {
                                            console.error("Error committing transaction:", err);
                                            centralError = 1;
                                            centralConnection.rollback();
                                            centralConnection.end();
                                            resolve();
                                            return;
                                        }
                                        centralConnection.end(() => {
                                            resolve();
                                            return;
                                        });
                                    });
                                });
                            });
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
                                connection.end(() => {
                                    resolve();
                                });
                                return;
                            }
                            connection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE', (err) => {
                                if (err) {
                                    connection.end();
                                    console.error("Error setting isolation level:", err);
                                    fragError = 1;
                                    resolve();
                                    return;
                                }
                                connection.beginTransaction((err) => {
                                    if (err) {
                                        connection.rollback();
                                        connection.end();
                                        console.error("Error starting transaction:", err);
                                        fragError = 1;
                                        resolve();
                                        return;
                                    }
                                    connection.query(query, values, (err, results) => {
                                        if (err) {
                                            console.error("Error searching:", err);
                                            fragError = 1;
                                            connection.rollback();
                                            connection.end();
                                            resolve();
                                            return;
                                        }
                                        for (let key in results) {
                                            if (results.hasOwnProperty(key)) {
                                                totalResults.push(results[key]);
                                            }
                                        }
                                        connection.commit((err) => {
                                            if (err) {
                                                console.error("Error committing transaction:", err);
                                                fragError = 1;
                                                connection.rollback();
                                                connection.end();
                                                resolve();
                                                return;
                                            }
                                            connection.end(() => {
                                                resolve();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                } catch (error) {
                    console.error(error);
                }
            }
            return totalResults;
        }
        recovery();
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
        let centralError = 0, fragError = 0, nodetoDelete = -1;

        async function deleteCentral() {
            const centralConnection = createConnection(DB_PORTS[0]);
            try {
                await new Promise((resolve) => {
                    centralConnection.connect(err => {
                        if (err || req.cookies.Central == 2) {
                            centralError = 1;
                            centralConnection.end(() => {
                                resolve();
                            });
                            return;
                        }
                        centralConnection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE', (err) => {
                            if (err) {
                                centralConnection.end();
                                console.error("Error setting isolation level:", err);
                                centralError = 1;
                                resolve();
                                return;
                            }
                            centralConnection.beginTransaction((err) => {
                                if (err) {
                                    centralConnection.rollback();
                                    centralConnection.end();
                                    console.error("Error starting transaction:", err);
                                    centralError = 1;
                                    resolve();
                                    return;
                                }
                                const query = `DELETE FROM appointments WHERE apptid = ?`;
                                centralConnection.query(query, appointmentId, (err, result) => {
                                    if (err) {
                                        console.error("Error deleting row:", err);
                                        centralError = 1;
                                        centralConnection.rollback();
                                        centralConnection.end();
                                        resolve();
                                        return;
                                    }
                                    console.log("Row deleted successfully.");
                                    centralConnection.commit((err) => {
                                        if (err) {
                                            console.error("Error committing transaction:", err);
                                            centralError = 1;
                                            centralConnection.rollback();
                                            centralConnection.end();
                                            resolve();
                                            return;
                                        }
                                        centralConnection.end(() => {
                                            resolve();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            } catch (error) {
                console.error(error);
            }
        }

        async function deleteFrag() {
            let connection, hidden;
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
                            connection.end(() => {
                                resolve();
                            });
                            return;
                        }
                        connection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE', (err) => {
                            if (err) {
                                connection.end();
                                console.error("Error setting isolation level:", err);
                                fragError = 1;
                                resolve();
                                return;
                            }
                            connection.beginTransaction((err) => {
                                if (err) {
                                    connection.rollback();
                                    connection.end();
                                    console.error("Error starting transaction:", err);
                                    fragError = 1;
                                    resolve();
                                    return;
                                }
                                const query = `DELETE FROM appointments WHERE apptid = ?`;
                                connection.query(query, appointmentId, (err, result) => {
                                    if (err) {
                                        console.error("Error deleting row:", err);
                                        centralError = 1;
                                        connection.rollback();
                                        connection.end();
                                        resolve();
                                        return;
                                    }
                                    console.log("Row deleted successfully.");
                                    connection.commit((err) => {
                                        if (err) {
                                            console.error("Error committing transaction:", err);
                                            fragError = 1;
                                            connection.rollback();
                                            connection.end();
                                            resolve();
                                            return;
                                        }
                                        connection.end(() => {
                                            resolve();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            } catch (error) {
                console.error(error);
            }
        }
        recovery();
        if (req.cookies.mode == 1) {
            await deleteCentral();
            await deleteFrag();
        } else {
            await deleteFrag();
            await deleteCentral();
        }

        if (centralError == 1 && fragError == 1) {
            return res.status(500).json({ message: "Error deleting row." });
        } else if (centralError == 1) {
            // add to frag log
            let connection = createConnection(DB_PORTS[nodetoDelete]);
            connection.connect(err => {
                if (err) {
                    console.log(err);
                    connection.end();
                    return;
                }
                let idquery = `SELECT MAX(ID) FROM appointment_log`;
                let maxId;
                connection.query(idquery, (err, maxResult) => {
                    if (err) {
                        console.log(err);
                        connection.end();
                        return;
                    }
                    maxId = maxResult[0]['MAX(ID)'];
                    values = [appointmentId, "SENTINEL", -1, "SENTINEL", 0, 0, "SENTINEL", "SENTINEL", "SENTINEL", "SENTINEL", "-1", "DELETE", "0", maxId + 1];
                    let query = `INSERT INTO appointment_log (apptid, status, StartHour, type, \`Virtual\`, IsHospital, City, Province, RegionName, MainSpecialty, DoctorAge, Query, Node, ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    connection.query(query, values, (err, result) => {
                        if (err) {
                            console.log(err);
                            connection.end();
                            return;
                        }
                        console.log("Inserted to log");
                        connection.end();
                    });
                });
            });
        } else if (fragError == 1) {
            // add to central log
            let connection = createConnection(DB_PORTS[0]);
            connection.connect(err => {
                if (err) {
                    console.log(err);
                    connection.end();
                    return;
                }
                let idquery = `SELECT MAX(ID) FROM appointment_log`;
                let maxId;
                connection.query(idquery, (err, maxResult) => {
                    if (err) {
                        console.log(err);
                        connection.end();
                        return;
                    }
                    maxId = maxResult[0]['MAX(ID)'];
                    values = [appointmentId, "SENTINEL", -1, "SENTINEL", 0, 0, "SENTINEL", "SENTINEL", "SENTINEL", "SENTINEL", "-1", "DELETE", nodetoDelete.toString(), maxId + 1];
                    let query = `INSERT INTO appointment_log (apptid, status, StartHour, type, \`Virtual\`, IsHospital, City, Province, RegionName, MainSpecialty, DoctorAge, Query, Node, ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    connection.query(query, values, (err, result) => {
                        if (err) {
                            console.log(err);
                            connection.end();
                            return;
                        }
                        console.log("Inserted to log");
                        connection.end();
                    });
                });
            });
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
                            centralConnection.end(() => {
                                resolve();
                            });
                            return;
                        }
                        centralConnection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE', (err) => {
                            if (err) {
                                centralConnection.end();
                                console.error("Error setting isolation level:", err);
                                centralError = 1;
                                resolve();
                                return;
                            }
                            centralConnection.beginTransaction((err) => {
                                if (err) {
                                    centralConnection.rollback();
                                    centralConnection.end();
                                    console.error("Error starting transaction:", err);
                                    centralError = 1;
                                    resolve();
                                    return;
                                }
                                let query = `SELECT * FROM appointments WHERE apptid = ?`;
                                centralConnection.query(query, [appointmentId], (err, results) => {
                                    if (err) {
                                        console.error("Error searching for appointment:", err);
                                        centralError = 1;
                                        centralConnection.rollback();
                                        centralConnection.end();
                                        resolve();
                                        return;
                                    }
                                    for (let key in results) {
                                        if (results.hasOwnProperty(key)) {
                                            totalResults.push(results[key]);
                                        }
                                    }
                                    centralConnection.commit((err) => {
                                        if (err) {
                                            console.error("Error committing transaction:", err);
                                            centralError = 1;
                                            centralConnection.rollback();
                                            centralConnection.end();
                                            resolve();
                                            return;
                                        }
                                        centralConnection.end(() => {
                                            resolve();
                                        });
                                    });
                                });
                            });
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
                            connection.end(() => {
                                resolve();
                            });
                            return;
                        }
                        connection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE', (err) => {
                            if (err) {
                                connection.end();
                                console.error("Error setting isolation level:", err);
                                fragError = 1;
                                resolve();
                                return;
                            }
                            connection.beginTransaction((err) => {
                                if (err) {
                                    connection.rollback();
                                    connection.end();
                                    console.error("Error starting transaction:", err);
                                    fragError = 1;
                                    resolve();
                                    return;
                                }
                                let query = `SELECT * FROM appointments WHERE apptid = ?`;
                                connection.query(query, [appointmentId], (err, results) => {
                                    if (err) {
                                        console.error("Error searching for appointment:", err);
                                        fragError = 1;
                                        connection.rollback();
                                        connection.end();
                                        resolve();
                                        return;
                                    }
                                    for (let key in results) {
                                        if (results.hasOwnProperty(key)) {
                                            totalResults.push(results[key]);
                                        }
                                    }
                                    connection.commit((err) => {
                                        if (err) {
                                            console.error("Error committing transaction:", err);
                                            fragError = 1;
                                            connection.rollback();
                                            connection.end();
                                            resolve();
                                            return;
                                        }
                                        connection.end(() => {
                                            resolve();
                                        });
                                        return;
                                    });
                                });
                            });
                        });
                    });
                });
            } catch (error) {
                console.error(error);
            }
        }
        recovery();
        if (req.cookies.mode == 1) {
            await centralRecord();
            if (centralError == 1) {
                await fragRecord();
                if (fragError == 1) {
                    return res.status(500).json({ message: "Error searching for appointment." });
                }
            }
        } else {
            await fragRecord();
            if (fragError == 1) {
                await centralRecord();
                if (centralError == 1) {
                    return res.status(500).json({ message: "Error searching for appointment." });
                }
            }
        }
        res.render('editRecord', { data: totalResults[0] });

    },

    updateRecord: async (req, res) => {
        const { id, startHour, Status, Type, Virtual, Hospital, City, Province, Region, Specialty, Age } = req.body;
        let centralError = 0, fragError = 0, nodetoUpdate = -1;

        async function updateCentral() {
            let centralConnection = createConnection(DB_PORTS[0]);
            try {
                await new Promise((resolve) => {
                    centralConnection.connect(err => {
                        if (err || req.cookies.Central == 2) {
                            centralError = 1;
                            centralConnection.end(() => {
                                resolve();
                            });
                            return;
                        }
                        centralConnection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE', (err) => {
                            if (err) {
                                centralConnection.end();
                                console.error("Error setting isolation level:", err);
                                centralError = 1;
                                resolve();
                                return;
                            }
                            centralConnection.beginTransaction((err) => {
                                if (err) {
                                    centralConnection.rollback();
                                    centralConnection.end();
                                    console.error("Error starting transaction:", err);
                                    centralError = 1;
                                    resolve();
                                    return;
                                }
                                let query = `UPDATE appointments SET status = ?, StartHour = ?, type = ?, \`Virtual\` = ?, IsHospital = ?, City = ?, Province = ?, RegionName = ?, MainSpecialty = ?, DoctorAge = ? WHERE apptid = ?`;
                                centralConnection.query(query, [Status, startHour, Type, Virtual, Hospital, City, Province, Region, Specialty, Age, id], (err, result) => {
                                    if (err) {
                                        console.error('Failed to update row:', err);
                                        centralError = 1;
                                        centralConnection.rollback();
                                        centralConnection.end();
                                        resolve();
                                        return;
                                    }
                                    console.log('Row updated successfully');
                                    centralConnection.commit((err) => {
                                        if (err) {
                                            console.error("Error committing transaction:", err);
                                            centralError = 1;
                                            centralConnection.rollback();
                                            centralConnection.end();
                                            resolve();
                                            return;
                                        }
                                        centralConnection.end(() => {
                                            resolve();
                                        });
                                    });
                                }); 
                            });
                        });
                    });
                });
            } catch (error) {
                console.error(error);
            }
        }

        async function updateFrag() {
            let connection, hidden;
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
                            connection.end(() => {
                                resolve();
                            });
                            return;
                        }
                        connection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE', (err) => {
                            if (err) {
                                connection.end();
                                console.error("Error setting isolation level:", err);
                                fragError = 1;
                                resolve();
                                return;
                            }
                            connection.beginTransaction((err) => {
                                if (err) {
                                    connection.rollback();
                                    connection.end();
                                    console.error("Error starting transaction:", err);
                                    fragError = 1;
                                    resolve();
                                    return;
                                }
                                let query = `UPDATE appointments SET status = ?, StartHour = ?, type = ?, \`Virtual\` = ?, IsHospital = ?, City = ?, Province = ?, RegionName = ?, MainSpecialty = ?, DoctorAge = ? WHERE apptid = ?`;
                                connection.query(query, [Status, startHour, Type, Virtual, Hospital, City, Province, Region, Specialty, Age, id], (err, result) => {
                                    if (err) {
                                        console.error('Failed to update row:', err);
                                        fragError = 1;
                                        connection.rollback();
                                        connection.end();
                                        resolve();
                                        return;
                                    }
                                    console.log('Row updated successfully');
                                    connection.commit((err) => {
                                        if (err) {
                                            console.error("Error committing transaction:", err);
                                            fragError = 1;
                                            connection.rollback();
                                            connection.end();
                                            resolve();
                                            return;
                                        }
                                        connection.end(() => {
                                            resolve();
                                        });
                                    });
                                });

                            });
                        });
                    });
                });
            } catch (error) {
                console.error(error);
            }
        }
        recovery();
        if (req.cookies.mode == 1) {
            await updateCentral();
            await updateFrag();
        } else {
            await updateFrag();
            await updateCentral();
        }

        if (centralError == 1 && fragError == 1) {
            return res.status(500).json({ error: 'Failed to update row' });
        } else if (centralError == 1) {
            // add to frag log
            let connection = createConnection(DB_PORTS[nodetoUpdate]);
            connection.connect(err => {
                if (err) {
                    console.log(err);
                    connection.end();
                    return;
                }
                let idquery = `SELECT MAX(ID) FROM appointment_log`;
                let maxId;
                connection.query(idquery, (err, maxResult) => {
                    if (err) {
                        console.log(err);
                        connection.end();
                        return;
                    }
                    maxId = maxResult[0]['MAX(ID)'];
                    values = [id, Status, startHour, Type, Virtual, Hospital, City, Province, Region, Specialty, Age, "UPDATE", "0", maxId + 1];
                    let query = `INSERT INTO appointment_log (apptid, status, StartHour, type, \`Virtual\`, IsHospital, City, Province, RegionName, MainSpecialty, DoctorAge, Query, Node, ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    connection.query(query, values, (err, result) => {
                        if (err) {
                            console.log(err);
                            connection.end();
                            return;
                        }
                        console.log("Inserted to log");
                        connection.end();
                    });
                });
            });
        } else if (fragError == 1) {
            // add to central log
            let connection = createConnection(DB_PORTS[0]);
            connection.connect(err => {
                if (err) {
                    console.log(err);
                    connection.end();
                    return;
                }
                let idquery = `SELECT MAX(ID) FROM appointment_log`;
                let maxId;
                connection.query(idquery, (err, maxResult) => {
                    if (err) {
                        console.log(err);
                        connection.end();
                        return;
                    }
                    maxId = maxResult[0]['MAX(ID)'];
                    values = [id, Status, startHour, Type, Virtual, Hospital, City, Province, Region, Specialty, Age, "UPDATE", nodetoUpdate.toString(), maxId + 1];
                    let query = `INSERT INTO appointment_log (apptid, status, StartHour, type, \`Virtual\`, IsHospital, City, Province, RegionName, MainSpecialty, DoctorAge, Query, Node, ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    connection.query(query, values, (err, result) => {
                        if (err) {
                            console.log(err);
                            connection.end();
                            return;
                        }
                        console.log("Inserted to log");
                        connection.end();
                    });
                });
            });
        }
        res.json({ message: 'Row updated successfully' });

    }

}

module.exports = appointment;