const { createConnection, DB_PORTS } = require('./../db/config');
const { cookieChecker } = require('./../checker/cookie');
const admin = {

    render: (req, res) => {
        cookieChecker(req, res);
        luzonHide = req.cookies.Luz;
        visminHide = req.cookies.VisMin;
        centralHide = req.cookies.Central;
        try {
            res.render('admin', { luzonHide, visminHide, centralHide });
        } catch (error) {
            console.error(error);
        }
    },

    status: async (req, res) => {
        let results = [];
        let cookieList = [req.cookies.Central, req.cookies.Luz, req.cookies.VisMin];
        for (let i = 0; i < DB_PORTS.length; i++) {
            let connection = createConnection(DB_PORTS[i]);
            try {
                await new Promise((resolve, reject) => {
                    connection.connect(err => {
                        if (err) {
                            results.push(1);
                        } else {
                            if (cookieList[i] == 2) {
                                results.push(2);
                            } else {
                                results.push(0);
                            }
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
    },

    mode: async (req, res) => {
        const cookies = req.cookies;
        if (cookies.mode === '1') {
            await res.cookie('mode', '2');
        } else {
            await res.cookie('mode', '1');
        }
        try {
            res.json({ response: 'ok' })
        } catch (error) {
            console.error(error);
        }
    },

    hide: async (req, res) => {
        const i = req.params.type;
        let val;
        if (i == 0) {
            if (req.cookies.Central == 1) {
                await res.cookie('Central', 2);
                val = 2;
            } else {
                await res.cookie('Central', 1);
                val = 1;
            }
        } else if (i == 1) {
            if (req.cookies.VisMin == 1) {
                await res.cookie('VisMin', 2);
                val = 2;
            } else {
                await res.cookie('VisMin', 1);
                val = 1;
            }
        } else if (i == 2) {
            if (req.cookies.Luz == 1) {
                await res.cookie('Luz', 2);
                val = 2;
            } else {
                await res.cookie('Luz', 1);
                val = 1;
            }
        }
        try {
            res.json({ val })
        } catch (error) {
            console.error(error);
        }
    }

}

module.exports = admin;