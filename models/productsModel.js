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
