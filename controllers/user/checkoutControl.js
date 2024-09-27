
const Address = require('../../models/addressModel');
const Cart = require('../../models/cartModel');
const User = require('../../models/userModel');
const Order = require("../../models/ordersModel");
const Product =require("../../models/productsModel");
const Coupon  = require('../../models/couponModel');
const Razorpay = require('razorpay');
const crypto = require('crypto');





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



// cash on delevery 
const placeOrder = async (req, res) => {
    const { addressId, paymentMethod, couponCode } = req.body;
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
            const price = item.product.offerPrice || item.product.price;
            const totalPrice = price * item.quantity;
            totalAmount += totalPrice;

            // Check if the product has enough stock
            if (item.product.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Not enough stock for ${item.product.name}.` });
            }

            products.push({
                productId: item.product._id,
                quantity: item.quantity,
                price: price,
                totalPrice,
                status: 'Pending'
            });
        }

        let totalDiscount = 0;
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode, status: true });
            if (coupon) {
                totalDiscount = (totalAmount * coupon.discount) / 100;
                if (coupon.maxDiscountAmount > 0) {
                    totalDiscount = Math.min(totalDiscount, coupon.maxDiscountAmount);
                }
            } else {
                return res.status(400).json({ success: false, message: 'Invalid or expired coupon.' });
            }
        }

        // Distribute discount proportionally to each product
        let totalDiscountDistributed = 0;
        products.forEach((product, index) => {
            const productShare = product.totalPrice / totalAmount; // The percentage share of the product
            let productDiscount = totalDiscount * productShare;
            productDiscount = Math.round(productDiscount * 100) / 100; // Round to two decimal places

            // Apply discount to each product
            product.totalPrice -= productDiscount;

            // Keep track of the total discount applied so far
            totalDiscountDistributed += productDiscount;

            // For the last product, adjust the rounding difference (to ensure exact total)
            if (index === products.length - 1) {
                const roundingDifference = totalDiscount - totalDiscountDistributed;
                product.totalPrice -= roundingDifference; // Ensure exact total
            }
        });

        // Adjust the total amount after the distributed discount
        totalAmount -= totalDiscount;

        // Generate a unique orderId (you can use a better generator or UUID here)
        const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Create a new order
        const newOrder = new Order({
            userId,
            orderId,
            paymentMethod,
            paymentStatus: 'Pending',
            address,
            products,
            totalAmount,
            orderDate: new Date(),
            discountAmount:totalDiscount
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

        // Return success response with the order ID
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
        const { addressId, couponCode } = req.query;
        const userId = req.session.user.id;

        // Fetch user's cart and calculate total amount
        const cart = await Cart.findOne({ user: userId }).populate('products.product', 'price offers');
        if (!cart || cart.products.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty.' });
        }

        // Calculate total amount considering offers
        let totalAmount = cart.products.reduce((sum, item) => {
            const product = item.product;
            const effectivePrice = calculateEffectivePrice(product); // Assuming this function calculates price with offers
            return sum + (effectivePrice * item.quantity);
        }, 0);

        // Initialize discount
        let discountAmount = 0;

        // Validate and apply coupon if provided
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode, status: true });

            if (!coupon) {
                return res.status(400).json({ success: false, message: 'Invalid or expired coupon code.' });
            }

          

            // Check minimum purchase amount
            if (totalAmount < coupon.minPurchaseAmount) {
                return res.status(400).json({ success: false, message: `Minimum purchase amount for this coupon is ₹${coupon.minPurchaseAmount}.` });
            }

            // Calculate discount amount
            discountAmount = (totalAmount * (coupon.discount / 100));

            // Apply maximum discount limit, if any
            if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
                discountAmount = coupon.maxDiscountAmount;
            }

            // Apply the discount
            totalAmount -= discountAmount;
        }

        // Create Razorpay order
        const options = {
            amount: totalAmount * 100, // Razorpay requires amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1
        };

        const razorpayOrder = await razorpay.orders.create(options);
        if (!razorpayOrder) {
            return res.status(500).json({ success: false, message: 'Failed to create Razorpay order.' });
        }

        // Send response with the updated total amount and Razorpay order details
        res.json({
            razorpayOrderId: razorpayOrder.id,
            totalAmount: totalAmount,
            discountAmount: discountAmount, // Provide discount information
            keyId: process.env.RAZORPAY_KEY_ID,
            addressId: addressId
        });

    } catch (error) {
        console.error('Error during Razorpay checkout:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};





// Function to verify Razorpay payment and place the order
const placeOrderAfterPayment = async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, addressId, couponCode, totalAmount } = req.body;
    const userId = req.session.user.id;

    try {
        // Step 1: Verify the Razorpay payment signature
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Payment verification failed' });
        }

        // Step 2: Fetch the address by its ID
        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(400).json({ success: false, message: 'Address not found' });
        }

        // Step 3: Fetch the user's cart
        const cart = await Cart.findOne({ user: userId }).populate('products.product');
        if (!cart || cart.products.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Step 4: Clean up the totalAmount (Remove currency symbol and convert to number)
        let cleanedTotalAmount = totalAmount.replace(/[^\d.-]/g, '');  // Remove currency symbols like ₹
        cleanedTotalAmount = parseFloat(cleanedTotalAmount);  // Convert string to a number

        const products = [];
        let totalProductAmount = 0; // This will calculate the total amount of all products (before discount)

        for (const item of cart.products) {
            const price = item.product.offerPrice || item.product.price;
            const totalPrice = price * item.quantity;

            // Check stock availability
            if (item.product.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Not enough stock for ${item.product.name}` });
            }

            totalProductAmount += totalPrice;

            products.push({
                productId: item.product._id,
                quantity: item.quantity,
                price: price,
                totalPrice,
                status: 'Pending'
            });
        }

        // Step 5: Apply coupon discount if any and distribute proportionally
        let discount = 0;
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode, status: true });
            if (coupon) {
                discount = (cleanedTotalAmount * coupon.discount) / 100;
                if (coupon.maxDiscountAmount > 0) {
                    discount = Math.min(discount, coupon.maxDiscountAmount);
                }

                // Distribute discount proportionally among the products
                let totalDiscountDistributed = 0;
                products.forEach((product, index) => {
                    const productShare = product.totalPrice / totalProductAmount;  // Percentage share of product
                    let productDiscount = discount * productShare;
                    productDiscount = Math.round(productDiscount * 100) / 100;  // Round to two decimal places

                    // Apply discount to the product totalPrice
                    product.totalPrice -= productDiscount;

                    // Keep track of total discount applied
                    totalDiscountDistributed += productDiscount;

                    // For the last product, adjust rounding difference
                    if (index === products.length - 1) {
                        const roundingDifference = discount - totalDiscountDistributed;
                        product.totalPrice -= roundingDifference;  // Ensure exact total discount
                    }
                });

                // Adjust the cleanedTotalAmount after discount distribution
                cleanedTotalAmount 
            }
        }

        // Step 6: Generate a unique orderId
        const orderId = `ORD-${Date.now()}`;

        // Step 7: Create the order with the correct enum value for paymentStatus
        const newOrder = new Order({
            userId,
            orderId,
            paymentMethod: 'razorpay',
            paymentStatus: 'Success',  // Use a valid value from the enum
            address,
            products,
            totalAmount: cleanedTotalAmount,  // Use the cleaned total amount after discount
            orderDate: new Date(),
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            discountAmount: discount  // Track the applied discount
        });

        // Step 8: Save the order
        await newOrder.save();

        // Step 9: Clear the user's cart after successful order
        await Cart.updateOne({ user: userId }, { $set: { products: [] } });

        // Step 10: Save the orderId in session and send success response
        req.session.orderId = newOrder.orderId;
        res.json({ success: true, orderId: newOrder.orderId });
    } catch (error) {
        console.error('Error while placing order after payment:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
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
    applyCoupon,
    placeOrderAfterPayment
};