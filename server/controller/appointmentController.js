const appointment = {

    render: (req, res) => {
        try {
            res.render('appointment');
        } catch (error) {
            console.error(error);
        }
    }

}

module.exports = appointment;