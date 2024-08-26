const express =require('express');
const app = express();


app.set('view engine','ejs');
app.set('views','./views/Admin');

const isAuthenticated = require('../Middlewares/Authention');

const brandControl = require('../controllers/admin/brandControl');
const adminController = require('../controllers/admin/adminController');
const UserController  = require('../controllers/admin/UsersControllers');
const CategoryController = require('../controllers/admin/CategoryManagement');
const productController = require('../controllers/admin/productsController');


const upload = require('../config/multer');

//admin login
app.get('/',adminController.loadAdminLoginPage);
app.post('/login', adminController.verifyadmin);

// logout
app.get('/logout',adminController.adminLogout);

// load admin dashbord
app.get('/dashbord',isAuthenticated,adminController.loadDashbord);

// for brand 
app.get('/brands',isAuthenticated,brandControl.loadBrands);
app.post('/add-brand',isAuthenticated, brandControl.addBrand);
app.post('/update-brand/:brandId',isAuthenticated, brandControl.updateBrand);
app.post('/toggle-status/:brandId',isAuthenticated, brandControl.toggleStatus);

// for category
app.get('/Category',isAuthenticated,CategoryController.loadCategoryManagementPage);
app.post('/addCategory',isAuthenticated,CategoryController.addCategory);
app.post('/toggle-category-status',isAuthenticated,CategoryController.toggleStatus);
app.post('/update-category-name',isAuthenticated, CategoryController.updateCategoryName);

// for user management
app.get('/Users',isAuthenticated,UserController.LoadUserManagement);
app.post('/Users',isAuthenticated,UserController.blockUser);


//products
app.get('/Product',isAuthenticated,productController.loadProductsPage);
app.get('/add-product',isAuthenticated,productController.loadAddproduct);
app.post('/add-product',isAuthenticated,upload.array('productimage', 3),productController.addProduct);
app.get('/edit-Product',isAuthenticated,productController.loadEditProduct);
app.post('/update-product/:productId',isAuthenticated, upload.array('productimage', 3), productController.updateProduct);
app.post('/toggle-listing/:productId',isAuthenticated, productController.toggleListingStatus);

module.exports = app ;













