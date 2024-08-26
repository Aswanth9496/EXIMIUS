const User = require('../../models/userModel');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt'); 

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
            return done(null, existingUser);
        }

        // If user doesn't exist, create a new one
        const newUser = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            verified: true
        });
        

        await newUser.save();
        return done(null, newUser);
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

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
}

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
                res.render('home.ejs');
            } else {
               
                res.render('login.ejs', { message: "Incorrect password" });
                
            }
        } else {
            
            res.render('login.ejs', { message: "Invalid user" });
           
        }
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    loginLoad,
    userVerification
}
