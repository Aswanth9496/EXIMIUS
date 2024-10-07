const User = require('../models/userModel');


const UserLoginCheck = (req, res, next) => {
    if (req.session.user && req.session.user.id) {
        res.redirect('/');
    } else {
        
        return next()
    }
};


module.exports= UserLoginCheck;

