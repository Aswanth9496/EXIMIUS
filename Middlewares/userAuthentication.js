const User = require('../models/userModel');

const UserAuthentication  = async (req,res,next)=>{
    
    if (req.session.user && req.session.user.id) {
        const user = await User.findById(req.session.user.id);


        if (user && !user.isBlocked) {
            return next(); // Proceed if user is valid and not blocked
        } else if (user && user.isBlocked) {
            // If the user is blocked, show a relevant message
            return res.render('error')
        } else{
            return res.redirect('/login');
        }
        
        
    } else {
        res.redirect('/login');
    }
};


module.exports =UserAuthentication;