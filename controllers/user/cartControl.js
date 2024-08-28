const Cart = require('../../models/cartModel');
const Product = require('../../models/productsModel'); 

// Load user cart
const loadCart = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const cart = await Cart.findOne({ user: userId }).populate('products.product');
       
        // Check if cart is empty
        if (!cart || cart.products.length === 0) {
            return res.render('cart', { emptyCart: true });
        }

        // Calculate total price
        const totalPrice = cart.products.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);

        res.render('cart', { totalPrice, cart, emptyCart: false });

    } catch (error) {
        console.error('Error loading cart:', error);
        res.status(500).send('Internal server error');
    }
};

// Add to cart
const addToCart = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { productId, quantity } = req.body;
        console.log(userId," ", productId, quantity);
        

        if (!productId || quantity <= 0) {
            return res.status(400).send('Invalid product ID or quantity');
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found');
        }

        let cart = await Cart.findOne({ user: userId });

      
        // Check if the product is already in the cart
        const existingProductIndex = cart.products.findIndex(item => item.product.equals(productId));
        if (existingProductIndex > -1) {
            
            cart.products[existingProductIndex].quantity += quantity;
        } else {
            // Add new product to the cart
            cart.products.push({ product: productId, quantity });
        }

        await cart.save();
        

        res.redirect('/cart');
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).send('Internal server error');
    }
};

module.exports = {
    loadCart,
    addToCart
};
