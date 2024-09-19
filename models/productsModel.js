const mongoose = require('mongoose');

const productSchema =   new mongoose.Schema({
    name:{
        type :String,
        required:true
    },  
    productimages: {
        type: [String],
        required: true
      },
    brand:{
        type :mongoose.Schema.Types.ObjectId,
        ref: "Brand",
        required:true 
    },
    category:{
        type :mongoose.Schema.Types.ObjectId,
        ref:"Category",
        required:true
    },
    quantity:{
        type :Number,
        required:true
    },
    price:{
        type :Number,
        required:true
    },
    offerPrice: {
        type: Number
       
    },
    offers: [{
        offerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Offers',
        },
        discount: {
            type: Number,
            required: true, // Store discount percentage for each offer
        }
    }],
    discription:{
        type :String,
        required:true
    },
    Date: {
        type: Date,
        default: Date.now,
        require:true
      },
      listed: {
        type: Boolean,
        required: true
      }
});

module.exports = mongoose.model('product',productSchema);
