const User = require('../models/userModel');




const UserAuthentication = async (req, res, next) => {
    try {
        if (req.session.user && req.session.user.id) {
            const user = await User.findById(req.session.user.id);

            if (user) {
                if (!user.isBlocked) {
                    return next(); // Proceed if user is valid and not blocked
                } else {
                    // If the user is blocked, create an error object
                    const err = new Error('Your account is blocked. Please contact support.');
                    err.status = 403; // Forbidden status
                    return next(err); // Pass the error to the error handler
                }
            } else {
                return res.redirect('/login'); // User not found
            }
        } else {
            return res.redirect('/login'); // No user session
        }
    } catch (error) {
        next(error); // Handle any unexpected errors
    }
};

module.exports =UserAuthentication;