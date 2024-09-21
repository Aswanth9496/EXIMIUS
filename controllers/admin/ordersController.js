 const Orders = require('../../models/ordersModel');

 const Product  = require('../../models/productsModel');



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





const acceptReturnRequest = async (req, res) => {
    try {
        const { productId, orderId } = req.body;
       

        // Find the order and update the product status and return request
        const order = await Orders.findOneAndUpdate(
            { _id: orderId, 'products.productId': productId, 'products.return_request': true }, // Ensure return was requested
            { 
                $set: { 
                    'products.$.status': 'Returned', 
                    'products.$.return_request': false 
                } 
            },
            { new: true } // Return the updated document
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order or product not found.' });
        }

        // Find the returned product
        const returnedProduct = order.products.find(p => p.productId.toString() === productId);
        if (!returnedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found in the order.' });
        }

        // Get the quantity of the returned product
        const returnedQuantity = returnedProduct.quantity;

        // Update the stock in the Product collection
        await Product.findByIdAndUpdate(
            productId,
            { $inc: { quantity: returnedQuantity } } // Increment the product's quantity
        );

        // Return success response
        res.json({ success: true, message: 'Return request accepted successfully' });

    } catch (error) {
        // Handle server error
        console.error('Error accepting return request:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};


module.exports ={
    loadOrders,
    orderDetails,
    updateOrderStatus,
    acceptReturnRequest
};
