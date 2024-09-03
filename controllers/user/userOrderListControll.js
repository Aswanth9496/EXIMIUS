const Order = require('../../models/ordersModel');
const Product =require('../../models/productsModel');



const loadOrderList = async (req,res)=>{
    try {

        const userId = req.session.user.id;
        const orders = await Order.find({ userId: userId }).sort({ orderDate: -1 });

        res.render('orderList', { orders });
    } catch (error) {
        console.log(error);
        
    }
};


const returnOrder = async (req,res)=>{
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).send('Order not found');
        ;}

        

        order.products.forEach(product => {
            product.status = 'Returned';
        });


        await order.save();
        res.redirect('/orderList');
    } catch (error) {
        console.log(error);
        
    }
};


const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).populate('products.productId');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Update the status of each product to 'Cancelled' and add the stock back to the Product collection
        for (let item of order.products) {
            item.status = 'Cancelled';

            const product = await Product.findById(item.productId._id);
            if (product) {
                product.quantity += item.quantity; // Add the canceled quantity back to the product's stock
                await product.save(); // Save the updated product stock
            } else {
                console.log(`Product with ID ${item.productId._id} not found.`);
            }
        }

        await order.save(); // Save the updated order status
        res.redirect('/orderList'); // Redirect to the order list page

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};


const loadOrderDetails = async (req,res)=>{

    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).populate('products.productId');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        const addressdata = order.address;

        res.render('UserPeofileOrderDetails', { order, addressdata });

      
    } catch (error) {
        console.log(error);
        
    }
}



module.exports={
    loadOrderList,
    loadOrderDetails,
    returnOrder,
    cancelOrder
}
