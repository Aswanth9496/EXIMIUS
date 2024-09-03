const User = require('../../models/userModel');
const nodemailer = require('nodemailer');
const session = require('express-session');
const bcrypt = require('bcrypt');
const saltRounds = 10; 


// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.USER, 
        pass: process.env.PASS
    }
});


// Function to generate OTP
function generateOTP() {
    let otp = '';
    const digits = '0123456789';
    for (let i = 0; i < 4; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}

// Send email function
const sendMail = (to, text) => {
    const mailOptions = {
        from: process.env.USER, 
        to: to, 
        subject: " Your OTP Code for Registration",
        text: `Thank you for registering with us!
              To complete your registration, please enter the following One-Time Password  ${text} in the verification field.
              This code is valid for the next 10 minutes. If you didn’t request this code or if you encounter any issues, please contact our support team.
              Best regards,
              EXIMIUS `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log('Error sending email: ', error);
        }
        console.log('Email sent: ');
    });
};






// Load user registration form
const loadRegister = async (req, res) => {
    try {
        res.render('userRegister.ejs', { message: null });
    } catch (error) {
        console.log(error.message);
    }
}

// User registration
const registerUser = async (req, res) => {
    try {
        const { name, email, password, mobile, confirm } = req.body;

        if(password !=confirm){
            return res.render('userRegister.ejs', { message: "password does not match" });  
        }
      
        // Check if the user already exists
        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            return res.render('userRegister.ejs', { message: "Email already exists" });
        }else{

        let OTP = generateOTP();

         // Send OTP to user's email
         sendMail(email, OTP);

          // Hash the password using async/await
          const hashedPassword = await bcrypt.hash(password, saltRounds);


         // Store user data in session
         req.session.user = {
            name: name,
            email: email,
            password:hashedPassword,
            mobile:mobile
        };
      
       
        
         // Store OTP in session or temporary storage 
        req.session.otp = OTP;
        req.session.otpTimestamp = Date.now();
       
        res.redirect('/OTP'); // Redirect to OTP page
        }
 
        

    } catch (error) {
        console.log(error.message);
        res.render('userRegister.ejs', { message: "An error occurred during registration" });
    }
}


// Load OTP page
const lodeOTPpage = async (req, res) => {
    try {
        res.render('OTP.ejs', { message: '', startTimer: true });
    } catch (error) {
        console.log(error.message);
    }
}


// Verifying OTP
const verifiyingOTP = async (req, res) => {
    try {
        let OTP = req.body.otp1 + req.body.otp2 + req.body.otp3 + req.body.otp4;
        
        if (req.session.otp === OTP) {
            const { name, email, password, mobile } = req.session.user;
             
            const newUser = new User({
                name,
                email,
                password,
                mobile,
                verified: true // Set user as verified
            });

            // Save the new user to the database
            await newUser.save();

            // Clear the session data
            req.session.otp = null;
            req.session.user = null;

            res.json({ success: true });
        } else {
            res.json({ success: false, message: "Invalid OTP, please try again" });
        }
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: "An error occurred, please try again" });
    }
};




const resendOTP = async (req, res) => {
    try {
        let newOTP = generateOTP();
        let email = req.session.user.email;
        req.session.otp = newOTP;
        req.session.otpTimestamp = Date.now();

        // Send the new OTP
        sendMail(email, newOTP);

        // Indicate that OTP has been resent
        res.render('OTP.ejs', { message: "OTP resend successful", startTimer: true });

    } catch (error) {
        console.log(error);
        res.render('OTP.ejs', { message: "An error occurred, please try again" });
    }
};


const remainingtime = (req,res)=>{
    const otpValidityDuration = 30 * 1000; // 30 seconds in milliseconds
    if (req.session.otpTimestamp) {
        const elapsedTime = Date.now() - req.session.otpTimestamp;
        const remainingTime = Math.max(otpValidityDuration - elapsedTime, 0);
        res.json({ remainingTime: Math.ceil(remainingTime / 1000) });
    } else {
        res.json({ remainingTime: 0 });
    }
}



module.exports ={
    lodeOTPpage,
    verifiyingOTP,
    loadRegister,
    registerUser,
    resendOTP,
    remainingtime
}