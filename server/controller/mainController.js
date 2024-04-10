const { createConnection, DB_PORTS } = require('./../db/config');
const { LUZON, VISAYAS, MINDANAO } = require('./../db/region');
const { cookieChecker } = require('./../checker/cookie');
const { recovery } = require('./../db/recovery');

const dashboard = {

    render: async (req, res) => {
        cookieChecker(req, res);
        let luzonCount = 0, visayasCount = 0, mindanaoCount = 0, totalCount = 0;
        let centralError = 0, luzonError = 0, visMinError = 0;

        async function centralNode(mode) {
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
                                console.error(err);
                                centralError = 1;
                                resolve();
                                return;
                            }
                            centralConnection.beginTransaction(err => {
                                if (err) {
                                    centralConnection.rollback()
                                    centralConnection.end();
                                    console.error(err);
                                    centralError = 1;
                                    resolve();
                                    return;
                                }
                                // 0 = all, 1 = luzon, 2 = visayas and mindanao
                                if (mode === 0 || mode === 1) {
                                    let luzonQuery = `SELECT COUNT(*) as count FROM appointments WHERE RegionName IN (${LUZON.map(region => `'${region}'`).join(', ')});`;
                                    centralConnection.query(luzonQuery, (err, results) => {
                                        if (!err && results.length > 0) {
                                            luzonCount = results[0].count;
                                        }
                                    });
                                }
                                if (mode === 0 || mode === 2) {
                                    let visayasQuery = `SELECT COUNT(*) as count FROM appointments WHERE RegionName IN (${VISAYAS.map(region => `'${region}'`).join(', ')});`;
                                    centralConnection.query(visayasQuery, (err, results) => {
                                        if (!err && results.length > 0) {
                                            visayasCount = results[0].count;
                                        }
                                    });

                                    let mindanaoQuery = `SELECT COUNT(*) as count FROM appointments WHERE RegionName IN (${MINDANAO.map(region => `'${region}'`).join(', ')});`;
                                    centralConnection.query(mindanaoQuery, (err, results) => {
                                        if (!err && results.length > 0) {
                                            mindanaoCount = results[0].count;
                                        }
                                    });
                                }
                                centralConnection.commit(err => {
                                    if (err) {
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
            } catch (error) {
                console.error(error);
            }

        }

        async function fragNode() {
            let luzonConnection = createConnection(DB_PORTS[1]);
            try {
                await new Promise((resolve) => {
                    luzonConnection.connect(err => {
                        if (err || req.cookies.Luz == 2) {
                            luzonError = 1;
                            luzonConnection.end(() => {
                                resolve();
                            });
                            return;
                        }
                        luzonConnection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE', (err) => {
                            if (err) {
                                luzonConnection.end();
                                console.error(err);
                                luzonError = 1;
                                resolve();
                                return;
                            }
                            luzonConnection.beginTransaction(err => {
                                if (err) {
                                    luzonConnection.rollback()
                                    luzonConnection.end();
                                    console.error(err);
                                    luzonError = 1;
                                    resolve();
                                    return;
                                }
                                let luzonQuery = `SELECT COUNT(*) as count FROM appointments WHERE RegionName IN (${LUZON.map(region => `'${region}'`).join(', ')});`;
                                luzonConnection.query(luzonQuery, (err, results) => {
                                    if (!err && results.length > 0) {
                                        luzonCount = results[0].count;
                                        luzonConnection.commit(err => {
                                            if (err) {
                                                console.error(err);
                                                luzonError = 1;
                                                luzonConnection.rollback();
                                                luzonConnection.end();
                                                resolve();
                                                return;
                                            }
                                            luzonConnection.end();
                                            resolve();
                                            return;
                                        });
                                    } else {
                                        luzonConnection.end()
                                        resolve();
                                    }
                                });
                            });
                        });
                    });
                });
            } catch (error) {
                console.error(error);
            }
            let visMinConnection = createConnection(DB_PORTS[2]);
            try {
                await new Promise((resolve) => {
                    visMinConnection.connect(err => {
                        if (err || req.cookies.VisMin == 2) {
                            visMinError = 1;
                            visMinConnection.end(() => {
                                resolve();
                            });
                            return;
                        }
                        visMinConnection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE', (err) => {
                            if (err) {
                                visMinConnection.end();
                                console.error(err);
                                visMinError = 1;
                                resolve();
                                return;
                            }
                            visMinConnection.beginTransaction(err => {
                                if (err) {
                                    visMinConnection.rollback()
                                    visMinConnection.end();
                                    console.error(err);
                                    visMinError = 1;
                                    resolve();
                                    return;
                                }
                                let visayasQuery = `SELECT COUNT(*) as count FROM appointments WHERE RegionName IN (${VISAYAS.map(region => `'${region}'`).join(', ')});`;
                                visMinConnection.query(visayasQuery, (err, results) => {
                                    if (!err && results.length > 0) {
                                        visayasCount = results[0].count;
                                    }
                                });

                                let mindanaoQuery = `SELECT COUNT(*) as count FROM appointments WHERE RegionName IN (${MINDANAO.map(region => `'${region}'`).join(', ')});`;
                                visMinConnection.query(mindanaoQuery, (err, results) => {
                                    if (!err && results.length > 0) {
                                        mindanaoCount = results[0].count;
                                    }
                                });
                                visMinConnection.commit(err => {
                                    if (err) {
                                        console.log(err)
                                        visMinError = 1;
                                        visMinConnection.rollback();
                                        visMinConnection.end();
                                        resolve();
                                        return;
                                    }
                                    visMinConnection.end(() => {
                                        resolve();
                                    });
                                    return;
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
            await centralNode(0);
            if (centralError == 1) {
                await fragNode();
                if (luzonError == 1) {
                    luzonCount = 0;
                }
                if (visMinError == 1) {
                    visayasCount = 0;
                    mindanaoCount = 0;
                }
            }
        } else { // 0 = all, 1 = luzon, 2 = visayas and mindanao
            let mode = -1;
            await fragNode();
            if (luzonError == 1) {
                mode = 1;
            }
            if (visMinError == 1) {
                if (mode == 1) {
                    mode = 0;
                } else {
                    mode = 2;
                }
            }
            if (luzonError == 1 || visMinError == 1) {
                await centralNode(mode);
                if (centralError == 1) {
                    if (mode == 1 || mode == 0) {
                        luzonCount = 0;
                    }
                    if (mode == 2 || mode == 0) {
                        visayasCount = 0;
                        mindanaoCount = 0;
                    }
                }
            }
        }
        totalCount = luzonCount + visayasCount + mindanaoCount;
        try {
            res.render('dashboard', { luzonCount, visayasCount, mindanaoCount, totalCount });
        } catch (error) {
            console.error(error);
        }
    },

    fetchData: async (req, res) => {
        const RegionName = req.params.region;

        let sql = `SELECT MainSpecialty, COUNT(*) AS count FROM appointments WHERE RegionName = '${RegionName}' GROUP BY MainSpecialty`;
        const none = [];
        let centralError = 0, fragError = 0;
        let data = {
            labels: [],
            values: []
        };;
        async function centralFetch() {
            const centralConnection = createConnection(DB_PORTS[0]);
            try {
                await new Promise((resolve, reject) => {
                    centralConnection.connect(err => {
                        if (err || req.cookies.Central == 2) {
                            centralError = 1;
                            centralConnection.end(() => {
                                resolve();
                            });
                            return;
                        } else {
                            centralConnection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE', (err) => {
                                if (err) {
                                    centralConnection.end();
                                    console.error(err);
                                    centralError = 1;
                                    resolve();
                                    return;
                                }
                                centralConnection.beginTransaction(err => {
                                    if (err) {
                                        centralConnection.rollback()
                                        centralConnection.end();
                                        console.error(err);
                                        centralError = 1;
                                        resolve();
                                        return;
                                    }
                                    centralConnection.query(sql, (err, result) => {
                                        if (err || req.cookies.Central == 2) {
                                            centralError = 1;
                                            console.error(err);
                                            centralConnection.rollback();
                                            centralConnection.end();
                                            resolve();
                                            return;
                                        }

                                        result.forEach(entry => {
                                            data.labels.push(entry.MainSpecialty);
                                            data.values.push(entry.count);
                                        });
                                        centralConnection.commit(err => {
                                            if (err) {
                                                console.log(err)
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
                        }
                    });
                });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'An unexpected error occurred' });
            }
        }

        async function fragFetch() {
            let connection, hidden;
            if (LUZON.includes(RegionName)) {
                connection = createConnection(DB_PORTS[1]);
                hidden = req.cookies.Luz;
            } else {
                connection = createConnection(DB_PORTS[2]);
                hidden = req.cookies.VisMin;
            }
            try {
                await new Promise((resolve, reject) => {
                    connection.connect(err => {
                        if (err || hidden == 2) {
                            fragError = 1;
                            connection.end(() => {
                                resolve();
                            });
                            return;
                        } else {
                            connection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE', (err) => {
                                if (err) {
                                    connection.end();
                                    console.error(err);
                                    fragError = 1;
                                    resolve();
                                    return;
                                }
                                connection.beginTransaction(err => {
                                    if (err) {
                                        connection.rollback()
                                        connection.end();
                                        console.error(err);
                                        fragError = 1;
                                        resolve();
                                        return;
                                    }
                                    connection.query(sql, (err, result) => {
                                        if (err || hidden == 2) {
                                            fragError = 1;
                                            console.error(err);
                                            connection.rollback();
                                            connection.end();
                                            resolve();
                                            return;
                                        }

                                        result.forEach(entry => {
                                            data.labels.push(entry.MainSpecialty);
                                            data.values.push(entry.count);
                                        });
                                        connection.commit(err => {
                                            if (err) {
                                                console.log(err)
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
                        }
                    });
                });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'An unexpected error occurred' });
            }
        }
        recovery();
        if (req.cookies.mode == 1) {
            await centralFetch();
            if (centralError == 1) {
                await fragFetch();
                if (fragError == 1) {
                    return res.json(none);
                }
            }
        } else {
            await fragFetch();
            if (fragError == 1) {
                await centralFetch();
                if (centralError == 1) {
                    return res.json(none);
                }
            }
        }

        res.json(data);

    }
}

module.exports = dashboard;