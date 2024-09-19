
const Address = require('../../models/addressModel');
const Cart = require('../../models/cartModel');
const User = require('../../models/userModel');
const Order = require("../../models/ordersModel");
const Product =require("../../models/productsModel");
const Coupon  = require('../../models/couponModel');
const Razorpay = require('razorpay');






// load checkout page
const loadCheckout = async (req,res)=>{
    try {

        const userId = req.session.user.id;
        
        const addresses  = await Address.find({ user_id: userId });
        const cart = await Cart.findOne({ user: userId }).populate('products.product');
        const coupons = await Coupon.find();

        let totalPrice = 0;

        if (cart) {
            // Calculate the total price dynamically using offer prices if available
            cart.products.forEach(item => {
                const price = item.product.offerPrice || item.product.price;
                totalPrice += price * item.quantity;
            });
        }


       

       res.render('checkout',{ cart, totalPrice,addresses : addresses || [],coupons: coupons || []});


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
    const { addressId, paymentMethod, couponCode } = req.body;
    const userId = req.session.user.id;
    console.log(req.body);
    

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
            const price = item.product.offerPrice || item.product.price;
            const totalPrice = price * item.quantity;
            totalAmount += totalPrice;

            // Check if the product has enough stock
            if (item.product.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Not enough stock for ${item.product.name}.` });
            }

            if (couponCode) {

                const coupon = await Coupon.findOne({ code: couponCode, status: true });
                let discount = (totalAmount * coupon.discount) / 100;

                if (coupon.maxDiscountAmount > 0) {
                    discount = Math.min(discount, coupon.maxDiscountAmount); 
                }

                totalAmount -=discount
            }

            products.push({
                productId: item.product._id,
                quantity: item.quantity,
                price: price,
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





const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,    
    key_secret: process.env.RAZORPAY_KEY_SECRET 
});




const calculateEffectivePrice = (product) => {
    // Base price is the original price
    let effectivePrice = product.price;

    // If there are offers, calculate the best offer (maximum discount)
    if (product.offers && product.offers.length > 0) {
        const bestDiscount = product.offers.reduce((maxDiscount, offer) => {
            return Math.max(maxDiscount, offer.discount);
        }, 0);

        // Apply the best discount
        effectivePrice = product.price - (product.price * (bestDiscount / 100));
    }

    return effectivePrice;
};



const razorpayCheckout = async (req, res) => {
    try {
        const { addressId } = req.query;
        const userId = req.session.user.id;

        // Fetch user's cart and calculate total amount
        const cart = await Cart.findOne({ user: userId }).populate('products.product', 'price offers');
        if (!cart || cart.products.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty.' });
        }

        // Calculate total amount considering offers
        let totalAmount = cart.products.reduce((sum, item) => {
            const product = item.product;

            // Calculate the effective price with offers
            const effectivePrice = calculateEffectivePrice(product);

            return sum + (effectivePrice * item.quantity);
        }, 0);

        // Create Razorpay order
        const options = {
            amount: totalAmount * 100, // Razorpay requires amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1
        };

        const razorpayOrder = await razorpay.orders.create(options);
        if (!razorpayOrder) {
            console.error("Failed to create Razorpay order");
            return res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
        }

        res.json({
            razorpayOrderId: razorpayOrder.id,
            totalAmount: totalAmount,
            keyId: process.env.RAZORPAY_KEY_ID,
            addressId: addressId
        });

    } catch (error) {
        console.error('Error during Razorpay checkout:', error); // Log error for further investigation
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};








// order details
const orderDetails = async (req,res)=>{
    try {

        const orderId = req.session.orderId;
        const order = await Order.findOne({ orderId }).populate('products.productId');

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




const applyCoupon = async (req, res) => {
    try {
        const { couponCode, totalAmount } = req.body;


        if (!couponCode || totalAmount == null) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code and total amount are required.',
            });
        }

        // Fetch the coupon from the database
        const coupon = await Coupon.findOne({ code: couponCode });

        if (!coupon) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coupon code. Please try again.',
            });
        }

        const currentDate = new Date();
        const expirationDate = new Date(coupon.expirationDate);

        if (expirationDate < currentDate) {
            return res.status(400).json({
                success: false,
                message: 'This coupon has expired.',
            });
        }

        if (totalAmount < coupon.minPurchaseAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum purchase amount for this coupon is ${coupon.minPurchaseAmount}.`,
            });
        }

        // Calculate discount
        let discount = (totalAmount * coupon.discount) / 100;
        if (coupon.maxDiscountAmount > 0) {
            discount = Math.min(discount, coupon.maxDiscountAmount);
        }

        return res.status(200).json({
            success: true,
            discount,
            message: 'Coupon applied successfully!',
        });

    } catch (error) {
        console.error('Error applying coupon:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.',
        });
    }
};




module.exports ={
    loadCheckout,
    addAddress,
    deleteAddress,
    placeOrder,
    orderDetails,
    razorpayCheckout,
    applyCoupon
};