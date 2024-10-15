require('dotenv').config();

const express = require('express');
const path = require('path');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const nocache = require('nocache');
const config = require('./config/config')



const app = express();

// Express session setup
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(nocache());

// Set 'public' as the static folder
app.use('/',express.static(path.join(__dirname, './public/user')));
app.use('/admin', express.static(path.join(__dirname, './public/admin')));
app.use(express.static(path.join(__dirname, './public')));


// Morgan for logging
app.use(morgan('dev'));


// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


// Body parser middleware (replaced with express built-in methods)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views/User'));

// Import routes
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

// MongoDB connection
const dbConnect = require('./config/db.Connect');
dbConnect();

// Use routes
app.use('/admin', adminRoutes);
app.use('/', userRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error for debugging
    
    // Set a default error message and status code
    const status = err.status || 500;
    const message = status === 404 ? err.message || 'Oops! The page you’re looking for doesn’t exist.' : 'Something went wrong! Please try again later.';

    // Render the error view with the dynamic status and message
    res.status(status).render('error', { status, message });
});




// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
