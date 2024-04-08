function cookieChecker(req, res) {
    const cookies = req.cookies;
    if (!(cookies.mode === '1' || cookies.mode === '2')) {
        res.cookie('mode', '1');
    }
    if (!(cookies.Central === '1' || cookies.Central === '2')) {
        res.cookie('Central', '1');
    }
    if (!(cookies.VisMin === '1' || cookies.VisMin === '2')) {
        res.cookie('VisMin', '1');
    }
    if (!(cookies.Luz === '1' || cookies.Luz === '2')) {
        res.cookie('Luz', '1');
    }
}

module.exports = { cookieChecker };



