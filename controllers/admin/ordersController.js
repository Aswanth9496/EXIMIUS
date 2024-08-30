 const Orders = require('../../models/ordersModel');


// load orders
const loadOrders = async (req,res)=>{
    try {

        const orders = await Orders.find().sort({ orderDate: -1 });
    
        res.render('orders',{orders});
        
    } catch (error) {
        console.log(error);
        
    }
};


// load order detais
const orderDetails = async (req,res)=>{
    try {

        const orderId = req.params.id;
        const order = await Orders.findById(orderId).populate('userId').populate('products.productId');
       

        if (!order) {
            return res.status(404).render('404', { message: 'Order not found' });
        };

        res.render('orderDetails',{ order });
        
    } catch (error) {
        console.log(error);
        
    }
};


const updateOrderStatus = async (req, res) => {
    try {
     
        const { status, productId ,orderId} = req.body; // new status and product ID


        const updatedOrder = await Orders.findOne(
            { 
                orderId:orderId });
console.log(updatedOrder,'its your updated order');
console.log(productId,'your produtct id is');

 const productindext=updatedOrder.products.findIndex(pro=>pro._id.toString()===productId)

updatedOrder.products[productindext].status=status

         await updatedOrder.save()
        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Order or product not found' });
        }

        res.json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


module.exports ={
    loadOrders,
    orderDetails,
    updateOrderStatus
};
