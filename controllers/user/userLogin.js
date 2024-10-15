const User = require('../../models/userModel');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt'); 


const Cart = require('../../models/cartModel');
const mongoose = require('mongoose');



// Passport Strategy for Google
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Get email from the profile
        const email = profile.emails[0].value;

        // Check if a user with the email already exists
        const existingUserByEmail = await User.findOne({ email: email });

        if (existingUserByEmail) {
            // User exists, proceed and create session
            return done(null, existingUserByEmail);
        }

        // If no user exists, return the profile for further processing
        return done(null, profile);
    } catch (err) {
        return done(err, null);
    }
}));

// Serialize user into session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});


// Load user login page
const loginLoad = async (req, res) => {
    try {
        res.render('login.ejs', { message: req.flash('error') });
    } catch (error) {
        console.log(error.message);
    }
};



// Verify the user 
const userVerification = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(req.body);
        
        // Find the user by email
        const existingUser = await User.findOne({ email: email });
        
        if (existingUser) {
            if(existingUser.isBlocked){
                res.render('login.ejs', { message: "user Banned from site" });
            }

           
            const isMatch = await bcrypt.compare(password, existingUser.password);
            
            if (isMatch) {
                req.session.user = {
                    id: existingUser._id,
                    username: existingUser.name
                };

                 // Ensure the user has a cart
                 const isCart = await Cart.findOne({ user: existingUser._id });
                 if (!isCart) {
                     await createCart(existingUser._id);
                 }

                res.redirect('/')
            } else {
               
                res.render('login.ejs', { message: "Incorrect password" });
                
            }
        } else {
            
            res.render('login.ejs', { message: "Invalid user" });
           
        }
    } catch (error) {
        console.log(error.message);
    }
};




module.exports = {
    loginLoad,
    userVerification
};
