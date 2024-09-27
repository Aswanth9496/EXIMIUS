 const Orders = require('../../models/ordersModel');

 const Product  = require('../../models/productsModel');
 const Wallet = require('../../models/walletModel');



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
        const { status, productId, orderId } = req.body; // new status and product ID

        // Find the order by orderId
        const updatedOrder = await Orders.findOne({ orderId: orderId });

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Find the product index in the order's products array
        const productIndex = updatedOrder.products.findIndex(pro => pro._id.toString() === productId);
        
        if (productIndex === -1) {
            return res.status(404).json({ success: false, message: 'Product not found in the order' });
        }

        // Update the product's status
        updatedOrder.products[productIndex].status = status;

        // Check if the new status is "Delivered", if so, update the paymentStatus to "Success"
        if (status === 'Delivered') {
            updatedOrder.paymentStatus = 'Success';
        }

        // Save the updated order
        await updatedOrder.save();

        // Send success response
        res.json({ success: true, message: 'Order status and payment status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};






const acceptReturnRequest = async (req, res) => {
    try {
        const { productId, orderId } = req.body;

        // Find the order and ensure the return was requested
        const order = await Orders.findOneAndUpdate(
            { _id: orderId, 'products.productId': productId, 'products.return_request': true },
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

        // Check if the payment status is 'Success' for refund eligibility
        if (order.paymentStatus !== 'Success') {
            return res.status(400).json({ success: false, message: 'Payment not completed, cannot process refund.' });
        }

        // Find the returned product in the order
        const returnedProduct = order.products.find(p => p.productId.toString() === productId);
        if (!returnedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found in the order.' });
        }

        // Refund based on the product's `totalPrice` (which includes coupon/discount deductions)
        const refundAmount = returnedProduct.totalPrice;

        if (!refundAmount) {
            return res.status(400).json({ success: false, message: 'Total price for the returned product is missing.' });
        }

        // Update the product stock in the Product collection
        await Product.findByIdAndUpdate(
            productId,
            { $inc: { quantity: returnedProduct.quantity } } // Increment the product's stock quantity
        );

        // Find the user's wallet or create a new one if it doesn't exist
        let userWallet = await Wallet.findOne({ user_id: order.userId });
        
        if (!userWallet) {
            // Create a new wallet for the user if none exists
            userWallet = new Wallet({
                user_id: order.userId,
                balance: 0,  // Initialize with 0 balance
                transactions: []
            });
        }

        // Update the user's wallet balance by adding the refund amount
        userWallet.balance += refundAmount;

        // Add a transaction to the wallet's transactions array
        userWallet.transactions.push({
            amount: refundAmount,
            description: `Refund for returned product from Order ${order.orderId}`,
            type: 'credit'
        });

        // Save the updated or newly created wallet
        await userWallet.save();

        // Return success response
        res.json({ success: true, message: 'Return request accepted and refund processed successfully.' });

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
