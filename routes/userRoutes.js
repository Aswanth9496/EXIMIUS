const express = require('express');
const router = express.Router();
const passport = require('passport');


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
const isAuthenticated = require('../Middlewares/Authention');



router.get('/', userController.lodeHomePage);
router.get('/logout',userController.logOut);

// User login controllers
router.get('/login', userLogin.loginLoad);
router.post('/login', userLogin.userVerification);


// User register controllers
router.get('/register', userRegistration.loadRegister);
router.post('/register', userRegistration.registerUser);

// OTP page and verification
router.get('/OTP', userRegistration.lodeOTPpage);
router.post('/OTP', userRegistration.verifiyingOTP);
router.post('/resendOTP',userRegistration.resendOTP);
router.get('/otp-remaining-time',userRegistration.remainingtime);

// Google OAuth routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }),
    (req, res) => {
        res.redirect('/');
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
router.get('/updateProfile',userAuthentication,userProfileController.updateProfile);

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



// user wallet
router.get('/wallet',walletControll.loadWallet);

// check out
router.get('/checkout',userAuthentication,checkoutController.loadCheckout);
router.post('/CheckoutAddaddress',userAuthentication,checkoutController.addAddress);
router.delete('/CheckoutDeleteAddress/:id',userAuthentication,checkoutController.deleteAddress);
router.post('/applyCoupon',userAuthentication,checkoutController.applyCoupon);


//order
router.post('/placeOrder',userAuthentication,checkoutController.placeOrder);
router.get('/orderConfirmation',userAuthentication,checkoutController.orderDetails);
router.post('/placeorder/:id',userAuthentication,checkoutController.placeOrder);

router.get('/razorpayCheckout',userAuthentication,checkoutController.razorpayCheckout);

module.exports = router;
