const mongoose = require('mongoose');



const brandShema = new mongoose.Schema({

    BrandName :{
        type: String,
        required: true,
      },
      description:{
        type : String,
        required:true
      },
      status: {
        type: String,
        default: 'Active', 
    }
});


module.exports = mongoose.model('Brand', brandShema);

