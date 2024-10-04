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
        const { timeFrame = 'yearly' } = req.query; // Default time frame is yearly

        let parsedStartDate, parsedEndDate;
        const now = new Date();

        // Determine the start and end dates based on the selected time frame
        switch (timeFrame) {
            case 'yearly':
                parsedStartDate = new Date(now.getFullYear(), 0, 1); // Start of the year
                parsedEndDate = new Date(now.getFullYear(), 11, 31); // End of the year
                break;
            case 'monthly':
                parsedStartDate = new Date(now.getFullYear(), now.getMonth(), 1); // Start of the month
                parsedEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of the month
                break;
            case 'weekly':
                const firstDayOfWeek = now.getDate() - now.getDay(); // Start of the week (Sunday)
                parsedStartDate = new Date(now.setDate(firstDayOfWeek));
                parsedEndDate = new Date(now.setDate(firstDayOfWeek + 6)); // End of the week (Saturday)
                parsedEndDate.setHours(23, 59, 59, 999);
                break;
            case 'daily':
                parsedStartDate = new Date(now.setHours(0, 0, 0, 0)); // Start of today
                parsedEndDate = new Date(now.setHours(23, 59, 59, 999)); // End of today
                break;
            default:
                throw new Error("Invalid time frame");
        }

        // Fetch order status data and format it
        const orderStatusData = await Order.aggregate([
            { $match: { orderDate: { $gte: parsedStartDate, $lte: parsedEndDate } } },
            { 
                $group: { 
                    _id: "$status", 
                    total: { $sum: 1 } 
                } 
            }
        ]);

        // Transform the order status data into a more readable format
        const formattedOrderStatusData = {};
        orderStatusData.forEach(order => {
            formattedOrderStatusData[order._id] = order.total; // e.g., { "Cancelled": 20, "Returned": 12, "Delivered": 5 }
        });

        // Fetch sales data (total sales amount for the time frame)
        const salesData = await Order.aggregate([
            { $match: { orderDate: { $gte: parsedStartDate, $lte: parsedEndDate } } },
            { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } }
        ]);

        console.log(formattedOrderStatusData, "Formatted Order Status Data");

        // Check if request is for JSON (XHR)
        if (req.xhr) {
            return res.json({ orderStatus: formattedOrderStatusData, sales: salesData });
        }
          
        
        
        // Render the dashboard with the fetched data
        res.render('dashbord', { orderStatusData: formattedOrderStatusData, salesData, timeFrame });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
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