const Order = require('../../models/ordersModel');
const Product =require('../../models/productsModel');
const  Wallet  = require('../../models/walletModel');



const PDFDocument = require('pdfkit');



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




const loadOrderDetails = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const userId = req.session.user.id;

        const order = await Order.findById(orderId).populate('products.productId');

        if (!order || order.userId._id.toString() !== userId) {
            const err = new Error('Order not found or access denied');
            err.status = 404;
            err.message = 'Order not found or access denied'; // Set the detailed message
            return next(err);
        }

        const addressdata = order.address;
        const user = req.session.user;

        res.render('UserPeofileOrderDetails', { order, addressdata, user, orderId });
    } catch (error) {
        next(error);
    }
};


const downloadInvoice = async (req, res) => {
    try {
        const { orderId } = req.body;

        // Fetch the order details from the database
        const order = await Order.findOne({ orderId }).populate('products.productId').exec();

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-disposition', 'attachment; filename="invoice.pdf"');
        res.setHeader('Content-type', 'application/pdf');
        doc.pipe(res);

        // Header Section
        doc.fontSize(24).text('INVOICE', { align: 'center', underline: true });
        doc.moveDown();

        // Company Details
        doc.fontSize(10)
            .text('EXIMIUS', { align: 'center' })
            .text('123 Street Name, City, State, ZIP', { align: 'center' })
            .text('Phone: (123) 456-7890 | Email: info@eximius.com', { align: 'center' });
        
        doc.moveDown(2);

        // Customer & Invoice Details
        doc.fontSize(12).text(`Invoice ID: ${order.orderId}`, 50, doc.y)
            .text(`Order Date: ${new Date(order.orderDate).toLocaleDateString()}`, 50, doc.y + 15)
            .text(`Payment Method: ${order.paymentMethod}`, 50, doc.y + 30)
            .text(`Payment Status: ${order.paymentStatus}`, 50, doc.y + 45)
            .moveDown(2);

        // Customer Address
        doc.fontSize(12).text('Bill To:', { underline: true })
            .text(order.address.addressName)
            .text(`${order.address.addressHouse}, ${order.address.addressStreet}`)
            .text(`${order.address.addressCity}, ${order.address.addressDistrict}`)
            .text(`${order.address.addressState} - ${order.address.addressPin}`)
            .text(`Phone: ${order.address.addressMobile}`)
            .text(`Email: ${order.address.addressEmail}`)
            .moveDown(2);

        // Products Table Header
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Product', 50, doc.y, { width: 200, continued: true })
            .text('Qty', 250, doc.y, { width: 50, align: 'right', continued: true })
            .text('Unit Price', 300, doc.y, { width: 100, align: 'right', continued: true })
            .text('Total', 400, doc.y, { width: 100, align: 'right' });
        doc.moveTo(50, doc.y + 5).lineTo(500, doc.y + 5).stroke();
        doc.moveDown(0.5);

        // Product Line Items
        let totalAmount = 0;
        order.products.forEach(item => {
            const productName = item.productId.name;
            const quantity = item.quantity;
            const price = item.price;
            const totalPrice = price * quantity;
            totalAmount += totalPrice;

            doc.font('Helvetica').fontSize(10)
                .text(productName, 50, doc.y, { width: 200, continued: true })
                .text(quantity, 250, doc.y, { width: 50, align: 'right', continued: true })
                .text(`₹${price.toFixed(2)}`, 300, doc.y, { width: 100, align: 'right', continued: true })
                .text(`₹${totalPrice.toFixed(2)}`, 400, doc.y, { width: 100, align: 'right' });
            doc.moveDown(0.5);
        });

        // Summary
        doc.moveTo(50, doc.y + 5).lineTo(500, doc.y + 5).stroke();
        doc.moveDown();
        doc.fontSize(10).font('Helvetica-Bold')
            .text(`Subtotal: ₹${totalAmount.toFixed(2)}`, 350, doc.y, { align: 'right' })
            .text(`Discount: ₹${order.discountAmount.toFixed(2)}`, 350, doc.y + 15, { align: 'right' })
            .text(`Shipping: ₹${order.shippingCharge.toFixed(2)}`, 350, doc.y + 30, { align: 'right' })
            .moveDown(1);

        // Total Amount
        const finalAmount = totalAmount - order.discountAmount + order.shippingCharge;
        doc.fontSize(12).font('Helvetica-Bold').text(`Total Amount: ₹${finalAmount.toFixed(2)}`, 350, doc.y, { align: 'right' });

        // Footer
        doc.moveDown(3);
        doc.fontSize(10).font('Helvetica')
            .text('Thank you for your purchase!', { align: 'center' })
            .text('If you have any questions, feel free to contact us at info@eximius.com.', { align: 'center' });

        doc.end();
    } catch (error) {
        console.error('Error generating invoice:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};



module.exports={
    loadOrderList,
    loadOrderDetails,
    returnOrder,
    cancelOrder,
    downloadInvoice
}
