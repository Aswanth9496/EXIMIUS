const express = require('express');
const router = express.Router();
const passport = require('passport');

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
router.get('/cart', cartController.loadCart);
router.post('/add_to_cart',cartController.addToCart);
router.delete('/removeFromCart/:id',cartController.deleteFromCart);
router.post('/updateCart',cartController.updateCart)


// profile
router.get('/profile',userProfileController.loadProfile);
router.post('/changePassword',userProfileController.updateUserPassword);
router.get('/updateProfile',userProfileController.updateProfile);

//profile address
router.get('/address',userAddressController.loadAddress);
router.post('/addAddress',userAddressController.addAddress);
router.delete('/deleteAddress/:id',userAddressController.deleteAddress);
router.post('/updateAddress',userAddressController.updateAddress);

router.get('/orderList',orderListController.loadOrderList);


// check out
router.get('/checkout',checkoutController.loadCheckout);
router.post('/CheckoutAddaddress',checkoutController.addAddress);
router.delete('/CheckoutDeleteAddress/:id',checkoutController.deleteAddress);


//order
router.post('/placeOrder',checkoutController.placeOrder);
router.get('/orderConfirmation',checkoutController.orderDetails);
router.post('/placeorder/:id',checkoutController.placeOrder);

module.exports = router;
