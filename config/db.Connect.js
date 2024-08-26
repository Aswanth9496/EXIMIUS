const mongoose = require('mongoose');

  // MongoDB connection
const dbConnect =async ()=>{
    
    try {

      mongoose.connect("mongodb://localhost:27017/Eximius") 
      console.log('connected to database');
      
    } catch (error) {
        console.log(error);
        
    }
}

module.exports = dbConnect;