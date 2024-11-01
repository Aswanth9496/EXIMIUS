const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/userModel');



const userAuthentication = require('../Middlewares/userAuthentication');


// Imported the userController module which contains the route handler functions
const userController = require('../controllers/user/userControl');
const userRegistration = require('../controllers/user/userRigistration');
const userLogin = require('../controllers/user/userLogin');
const storeController = require('../controllers/user/storeControl');
const cartController = require('../controllers/user/cartControl');
const userProfileController = require('../controllers/user/userProfileController');
const userAddressController= require('../controllers/user/userAddressControl');
const checkoutController = require('../controllers/user/checkoutControl');
const orderListController =require('../controllers/user/userOrderListControll');
const walletControll = require('../controllers/user/walletControl');
const WishlistControll = require ('../controllers/user/WishlistControl');
const UserLoginCheck = require('../Middlewares/UserLoginCheck');



router.get('/', userController.loadHomePage);
router.get('/logout',userController.logOut);

// User login controllers
router.get('/login',UserLoginCheck, userLogin.loginLoad);
router.post('/login', userLogin.userVerification);


// User register controllers
router.get('/register',UserLoginCheck, userRegistration.loadRegister);
router.post('/register', userRegistration.registerUser);

// OTP page and verification
router.get('/OTP',UserLoginCheck, userRegistration.lodeOTPpage);
router.post('/OTP', userRegistration.verifiyingOTP);
router.post('/resendOTP',userRegistration.resendOTP);
router.get('/otp-remaining-time',userRegistration.remainingtime);


router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }),
    async (req, res) => {
        // Successful authentication
        const { email, displayName, id } = req.user;

        // Check if a user with the email already exists
        const existingUserByEmail = await User.findOne({ email: email });

        if (existingUserByEmail) {
            // Create a session for the existing user
            req.session.user = {
                id: existingUserByEmail._id,
                username: existingUserByEmail.name
            };
            return res.redirect('/'); // Redirect to the home page
        }

        // If there's no existing user, create a new user
        const newUser = new User({
            name: displayName,
            email: email,
            googleId: id,
            verified: true
        });

        await newUser.save();

        // Create a session for the new user
        req.session.user = {
            id: newUser._id,
            username: newUser.name
        };

        return res.redirect('/'); // Redirect to the home page
    }
);






// store
router.get('/store',storeController.LoadStorePage);
router.get('/product-details/:id',storeController.productDetails);




// cart 
router.get('/cart',userAuthentication, cartController.loadCart);
router.post('/add_to_cart',userAuthentication,cartController.addToCart);
router.delete('/removeFromCart/:id',userAuthentication,cartController.deleteFromCart);
router.post('/updateCart',cartController.updateCart);


//Wishlist
router.get('/wishlist',userAuthentication,WishlistControll.loadWishlist);
router.get('/addToWishlist',userAuthentication,WishlistControll.addToWishlist);
router.delete('/removeFromWishlist/:productId',userAuthentication,WishlistControll.removeFromWishlist);


// profile
router.get('/profile',userAuthentication,userProfileController.loadProfile);
router.post('/changePassword',userAuthentication,userProfileController.updateUserPassword);
router.post('/updateProfile',userAuthentication,userProfileController.updateProfile);

//profile address
router.get('/address',userAuthentication,userAddressController.loadAddress);
router.post('/addAddress',userAuthentication,userAddressController.addAddress);
router.delete('/deleteAddress/:id',userAuthentication,userAddressController.deleteAddress);
router.post('/updateAddress/:id',userAuthentication,userAddressController.updateAddress);

//profile orders list
router.get('/orderList',userAuthentication,orderListController.loadOrderList);
router.get('/loadProfileOrderDetails/:id',userAuthentication,orderListController.loadOrderDetails);
router.post('/returnOrder',userAuthentication, orderListController.returnOrder);
router.post('/cancelOrder',userAuthentication, orderListController.cancelOrder);
router.post('/downloadInvoice',userAuthentication,orderListController.downloadInvoice);


// user wallet
router.get('/wallet',userAuthentication,walletControll.loadWallet);

// check out
router.get('/checkout',userAuthentication,checkoutController.loadCheckout);
router.post('/CheckoutAddaddress',userAuthentication,checkoutController.addAddress);
router.delete('/CheckoutDeleteAddress/:id',userAuthentication,checkoutController.deleteAddress);
router.post('/applyCoupon',userAuthentication,checkoutController.applyCoupon);


//order
router.post('/placeOrder',userAuthentication,checkoutController.placeOrder);
router.get('/orderConfirmation',userAuthentication,checkoutController.orderDetails);
router.post('/placeorder/:id',userAuthentication,checkoutController.placeOrder);

router.post('/placeOrderAfterPayment',userAuthentication,checkoutController.placeOrderAfterPayment);
router.post('/placeOrderFailed',userAuthentication,checkoutController.placeOrderFailed);
router.get('/razorpayCheckout',userAuthentication,checkoutController.razorpayCheckout);
router.post('/retrypayment',userAuthentication,checkoutController.retryPayment);
router.post('/verifyRetryPayment',userAuthentication,checkoutController.verifyRetryPayment);


router.use('*', (req, res,next) => res.render('error', {status: 404, message: ''}))

module.exports = router;
