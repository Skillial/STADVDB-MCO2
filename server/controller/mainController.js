const dashboard = {

    render: (req, res) => {
        try {
            res.render('dashboard');
        } catch (error) {
            console.error(error);
        }
    }

}

module.exports = dashboard;