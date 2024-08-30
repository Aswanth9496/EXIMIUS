const mongoose = require('mongoose');


const cartShema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      products: [{
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          default: 1
        }}]



});



const cart =mongoose.model('cart',cartShema);

module.exports= cart;

