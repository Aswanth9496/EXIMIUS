const mongoose = require('mongoose');


const offerSchema = new mongoose.Schema({
    offerName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    discount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: ['product', 'category'],
        required: true,
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'product',
                required: true,
            },

        }
    ],
    category: [
        {
            categoryId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category',
                required: true,
            }
        }
    ],
    status: {
        type: Boolean,
        required: true
    },
});

module.exports = mongoose.model('Offers', offerSchema);