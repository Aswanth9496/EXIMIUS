// middleware/authMiddleware.js
const isAuthenticated = (req, res, next) => {
    if (req.session.admin && req.session.admin.id) {
        return next();
    } else {
        res.redirect('/admin');
    }
};

module.exports = isAuthenticated;
