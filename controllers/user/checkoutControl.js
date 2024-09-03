
const Address = require('../../models/addressModel');
const Cart = require('../../models/cartModel');
const User = require('../../models/userModel');
const Order = require("../../models/ordersModel");
const Product =require("../../models/productsModel");


// load checkout page
const loadCheckout = async (req,res)=>{
    try {

        const userId = req.session.user.id;
        
        const addresses  = await Address.find({ user_id: userId });
        const cart = await Cart.findOne({ user: userId }).populate('products.product');

        let totalPrice = 0;

        if (cart) {
            // Calculate the total price dynamically
            cart.products.forEach(item => {
              totalPrice += item.product.price * item.quantity;
            });
          }

       

       res.render('checkout',{ cart, totalPrice,addresses : addresses || []});


    } catch (error) {
        console.log(error);
        
    }
};






// add a new address
const addAddress = async (req, res) => {
    try {

        const userId = req.session.user.id;
        const user = await User.findOne({ _id: userId });

        const newAddress = new Address({
            user_id: userId,
            addressName: req.body.addressName,
            addressEmail:user.email,
            addressMobile: req.body.addressMobile,
            addressHouse: req.body.addressHouse,
            addressStreet: req.body.addressStreet,
            addressCity: req.body.addressCity,
            addressDistrict: req.body.addressDistrict,
            addressState: req.body.addressState,
            addressPin: req.body.addressPin
        });

        await newAddress.save();

        res.redirect('/checkout'); // Redirect back to the address page after adding
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
};





// delect address
const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        await Address.findByIdAndDelete(addressId);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
};


const placeOrder = async (req, res) => {
    const { addressId, paymentMethod } = req.body;
    const userId = req.session.user.id;

    try {
        // Fetch the user's address
        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(400).json({ success: false, message: 'Address not found.' });
        }

        // Fetch the user's cart
        const cart = await Cart.findOne({ user: userId }).populate('products.product');
        if (!cart || cart.products.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty.' });
        }

        // Calculate totalAmount and prepare products array
        let totalAmount = 0;
        const products = [];

        for (const item of cart.products) {
            const totalPrice = item.product.price * item.quantity;
            totalAmount += totalPrice;

            // Check if the product has enough stock
            if (item.product.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Not enough stock for ${item.product.name}.` });
            }

            

            products.push({
                productId: item.product._id,
                quantity: item.quantity,
                price: item.product.price,
                totalPrice,
                status: 'Pending'
            });
        }

        // Generate a unique orderId
        const orderId = `ORD-${Date.now()}`;

        // Create a new order
        const newOrder = new Order({
            userId,
            orderId,
            paymentMethod,
            paymentStatus: 'Pending',
            address,
            products,
            totalAmount,
            orderDate: new Date()
        });

        // Save the order to the database
        await newOrder.save();

         

        // Clear the user's cart
        await Cart.updateOne(
            { user: userId },
            { $set: { products: [] } }
        );

        // Save the orderId in the session
        req.session.orderId = newOrder.orderId;

       
        res.json({ success: true, orderId: newOrder.orderId });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};



// order details
const orderDetails = async (req,res)=>{
    try {

        const orderId = req.session.orderId;
        const order = await Order.findOne({ orderId }).populate('products');

        for (let item of order.products) {
            const productId = item.productId._id;
            const orderedQuantity = item.quantity;

            // Find the product in the Product collection and reduce the quantity
            const product = await Product.findById(productId);

            if (product) {
                product.quantity -= orderedQuantity; // Reduce the stock by the ordered quantity
                if (product.quantity < 0) {
                    product.quantity = 0; // Ensure the quantity doesn't go negative
                }
                await product.save(); // Save the updated product
            } else {
                console.log(`Product with ID ${productId} not found.`);
            }
        }

      res.render('orderDetails',{order,addressdata: order.address});  
    } catch (error) {
        console.log(error);
        
    }

};
    




module.exports ={
    loadCheckout,
    addAddress,
   
    deleteAddress,
    placeOrder,
    orderDetails
};