const Wishlist  = require('../../models/wishlistModel');
const Product = require('../../models/productsModel'); 


const loadWishlist = async (req, res) => {
    try {
        const userId = req.session.user.id;
        let wishlist = await Wishlist.findOne({ user: userId }).populate('products.product');  // Use 'let' instead of 'const'
        
        if (!wishlist) {
            wishlist = { products: [] }; 
        }

        res.render('Wishlist', { wishlist });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};





const addToWishlist = async (req, res) => {
    try {

       
        const userId = req.session.user.id;
        const productId = req.query.productId;

        // Check if the product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Find or create a wishlist for the user
        let wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            wishlist = new Wishlist({ user: userId, products: [] });
        }

        // Check if the product is already in the wishlist
        const isProductInWishlist = wishlist.products.some(item => item.product.toString() === productId);

        
        if (isProductInWishlist) {
            // Redirect to wishlist with a query parameter indicating the product is already in the wishlist
            return res.redirect('/wishlist?status=exists');
        }

        // Add the product to the wishlist
        wishlist.products.push({ product: productId });

        // Save the updated wishlist
        await wishlist.save();

        res.redirect('/wishlist');

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


const removeFromWishlist = async (req, res) => {
    try {
        console.log('ki');
        
        const userId = req.session.user.id;
        const productId = req.params.productId;

        console.log(userId);
        console.log(productId);
        
        

        let wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }

        const initialLength = wishlist.products.length;
        wishlist.products = wishlist.products.filter(item => item.product.toString() !== productId);

        if (initialLength === wishlist.products.length) {
            return res.status(400).json({ message: 'Product not found in wishlist' });
        }

        await wishlist.save();

        res.status(200).json({ message: 'Product removed from wishlist' });
    } catch (error) {
        console.error('Error in removeFromWishlist:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};





module.exports = {
    loadWishlist,
    addToWishlist,
    removeFromWishlist
};