const mongoose = require('mongoose');

// MongoDB connection
const dbConnect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database');
    } catch (error) {
        console.log(error);
    }
};

module.exports = dbConnect;
