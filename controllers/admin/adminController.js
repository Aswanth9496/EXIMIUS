const Admin = require('../../models/adminModel');
const Order = require('../../models/ordersModel');


// load the login 
const loadAdminLoginPage = async (req,res)=>{
    try {
        if (req.session.admin && req.session.admin.id) {
            return res.redirect('/admin/dashbord'); 
        }
        res.render('adminLogin')
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
}







// admin verification
const verifyadmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingAdmin = await Admin.findOne({email});
        
        if (existingAdmin) {
            // Check if password matches
            if (password === existingAdmin.password) {

                req.session.admin = {
                    id: existingAdmin._id,
                    email: existingAdmin.email
                };
                
                res.redirect('/admin/dashbord');
            } else {
                // Incorrect password, show SweetAlert
                res.render('adminLogin', { message: "Incorrect password", alertType: "error" });
            }
        } else {
            // Invalid admin email, show SweetAlert
            console.log('user not found');
            
            res.render('adminLogin', { message: "Invalid Admin ID", alertType: "error" });
        }
    } catch (error) {
        console.log(error);
        res.render('adminLogin', { message: "Server error", alertType: "error" });
    }
};





const loadDashboard = async (req, res) => {
    try {
        // Extract start and end dates from query parameters
        const { startDate, endDate } = req.query;
        
        let parsedStartDate, parsedEndDate;
        const now = new Date();

        // Validate and parse the provided start and end dates
        if (startDate) {
            parsedStartDate = new Date(startDate);
            if (isNaN(parsedStartDate.getTime())) {
                return res.status(400).send('Invalid start date format.');
            }
        } else {
            parsedStartDate = new Date(now.getFullYear(), 0, 1); // Default to January 1st of the current year
        }

        if (endDate) {
            parsedEndDate = new Date(endDate);
            if (isNaN(parsedEndDate.getTime())) {
                return res.status(400).send('Invalid end date format.');
            }
        } else {
            parsedEndDate = new Date(now.getFullYear(), 11, 31); // Default to December 31st of the current year
        }

        // Check if the end date is before the start date
        if (parsedEndDate < parsedStartDate) {
            return res.status(400).send('End date must be greater than or equal to start date.');
        }

        // Fetch order status data and format it
        const orderStatusData = await Order.aggregate([
            { 
                $match: { 
                    orderDate: { $gte: parsedStartDate, $lte: parsedEndDate } 
                } 
            },
            { $unwind: "$products" },
            { 
                $group: { 
                    _id: "$products.status",  
                    total: { $sum: 1 } 
                } 
            }
        ]);

        const formattedOrderStatusData = { returned: 0, delivered: 0, cancelled: 0, pending: 0, shipped: 0 };
        orderStatusData.forEach(order => {
            const status = order._id.toLowerCase(); 
            if (formattedOrderStatusData.hasOwnProperty(status)) {
                formattedOrderStatusData[status] = order.total;
            }
        });

        const salesCountByProduct = await Order.aggregate([
            { $match: { orderDate: { $gte: parsedStartDate, $lte: parsedEndDate } } },
            { $unwind: "$products" },
            { 
                $lookup: {
                    from: "products",
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            { 
                $group: { 
                    _id: "$productDetails.name",
                    totalSales: { $sum: "$products.quantity" } 
                } 
            },
            { $sort: { totalSales: -1 } },
            { $limit: 10 }
        ]);

        const formattedSalesCountByProduct = salesCountByProduct.map(product => ({
            productName: product._id,
            salesCount: product.totalSales
        }));

        const topSellingBrands = await Order.aggregate([
            { $match: { orderDate: { $gte: parsedStartDate, $lte: parsedEndDate } } },
            { $unwind: "$products" },
            { 
                $lookup: {
                    from: "products",
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            { 
                $lookup: {
                    from: "brands",
                    localField: "productDetails.brand",
                    foreignField: "_id",
                    as: "brandDetails"
                }
            },
            { $unwind: "$brandDetails" },
            { 
                $group: { 
                    _id: "$brandDetails.BrandName",
                    totalSales: { $sum: "$products.quantity" } 
                } 
            },
            { $sort: { totalSales: -1 } },
            { $limit: 10 }
        ]);

        const formattedTopSellingBrands = topSellingBrands.map(brand => ({
            brandName: brand._id,
            salesCount: brand.totalSales
        }));

        // Check if request expects JSON response (for fetch)
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
           

            return res.json({
                orderStatus: formattedOrderStatusData,
                salesCountByProduct: formattedSalesCountByProduct,
                topSellingBrands: formattedTopSellingBrands,
                timeFrame: { startDate, endDate }
            });
        }

        // Render the dashboard with the fetched data for non-JSON requests
        res.render('dashbord', {
            orderStatusData: formattedOrderStatusData,
            salesCountByProduct: formattedSalesCountByProduct,
            topSellingBrands: formattedTopSellingBrands,
            timeFrame: { startDate, endDate }
        });

    } catch (error) {
        console.error("Dashboard data fetch error:", error);
        res.status(500).send('Failed to load dashboard data. Please try again.');
    }
};






// logout
const adminLogout = async(req,res)=>{
    try {
        req.session.destroy(err => {
            if (err) {
                console.log(err);
                res.status(500).send('Server Error');
            } else {
                res.redirect('/admin');
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
}


module.exports={
    loadDashboard,
    loadAdminLoginPage,
    verifyadmin,
    adminLogout
}