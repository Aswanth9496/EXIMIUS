const mongoose = require('mongoose');

// Define the schema for the wishlist
const WishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users', 
        required: true
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product', 
            required: true
        }
    }]
});

// Create and export the model based on the schema
const Wishlist = mongoose.model('Wishlist', WishlistSchema);

module.exports = Wishlist;
