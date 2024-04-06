const dashboard = {

    render: async (req, res) => {
        const cookies = req.cookies;
        if (!(cookies.mode === '1' || cookies.mode === '2')) {
            await res.cookie('mode', '1');
        }
        try {
            res.render('dashboard');
        } catch (error) {
            console.error(error);
        }
    }

}

module.exports = dashboard;