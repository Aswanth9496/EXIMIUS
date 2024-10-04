const Order = require('../../models/ordersModel');
const Product =require('../../models/productsModel');
const  Wallet  = require('../../models/walletModel');


const loadOrderList = async (req, res) => {
    try {
      const userId = req.session.user.id;
  
      // Fetch orders for the user, sorted by order date
      const orders = await Order.find({ userId: userId })
        .sort({ orderDate: -1 })
        .populate('products.productId', 'name');
  
      // Check if orders exist
      if (!orders || orders.length === 0) {
        return res.render('orderList', { orders: [], message: 'No orders found.' });
      }
  
      // Optional: Log the products of the first order for debugging
      if (orders[0] && orders[0].products) {
        console.log("First order products:", orders[0].products);
      } else {
        console.log("First order has no products.");
      }
  
      // Render the order list
      res.render('orderList', { orders });
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred while loading the order list.');
    }
  };
  


const returnOrder = async (req, res) => {
    try {
        const { orderId, productId } = req.query;

        // Find the order by orderId
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
               
        const product = order.products.find(p => p.productId.toString() === productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found in the order' });
        }

        // Check if the product is delivered and eligible for return
        if (product.status !== 'Delivered') {
            return res.status(400).json({ message: 'Only delivered products can be returned' });
        }

        // Update the product's status to 'Return Requested'
        product.status = 'Return Requested';
        product.return_request = true;

        // Save the order with the updated product status
        await order.save();

        res.json({ success: true, message: 'Return request submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error occurred' });
    }
};




const cancelOrder = async (req, res) => {
    try {
        const { orderId, productId } = req.query; // Extract orderId and productId from the query

        // Find the order by orderId
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Find the specific product within the order by productId
        const product = order.products.find(item => item.productId.toString() === productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found in the order' });
        }

        // Check if the product is already cancelled
        if (product.status === 'Cancelled') {
            return res.status(400).json({ message: 'Product is already cancelled.' });
        }

        // Update the status of the specific product to 'Cancelled'
        product.status = 'Cancelled';

        // Save the updated order
        await order.save();

        // Update the stock in the product collection
        const relatedProduct = await Product.findById(productId);

        if (relatedProduct) {
            relatedProduct.quantity += product.quantity; // Add the canceled quantity back to the stock
            await relatedProduct.save(); // Save the updated product stock
        } else {
            console.log(`Product with ID ${productId} not found in the product collection.`);
        }


        if (order.paymentStatus === 'Success') {
            // Calculate the refund amount for the canceled product
            const refundAmount = product.totalPrice;

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
                description: `Refund for cancelled product from Order ${order.orderId}`,
                type: 'credit',
                date: new Date() // Add a timestamp for the transaction
            });

            // Save the updated or newly created wallet
            await userWallet.save();
        }

        // Send success response
        res.json({ success: true, message: 'Product successfully cancelled and stock updated.' });
    } catch (error) {
        console.error('Error cancelling the product:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
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

        const user = req.session.user

        res.render('UserPeofileOrderDetails', { order, addressdata,user, orderId });

      
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
