const appointment = {

    render: (req, res) => {
        const cookies = req.cookies;
        if (!(cookies.mode === '1' || cookies.mode === '2')) {
            return res.redirect('/dashboard');
        }
        try {
            res.render('appointment');
        } catch (error) {
            console.error(error);
        }
    }

}

module.exports = appointment;