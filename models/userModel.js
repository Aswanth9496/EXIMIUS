const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
    },

    mobile: {
        type: String,
        required: false,
    },

    password: {
        type: String,
        required: function() {
            return !this.googleId;
        },
    },

    googleId: {
        type: String,
        required: false,
    },

    isBlocked: {
        type: Boolean,
        default: false,
    },

    verified: {
        type: Boolean,
        default: false,
    },

    created: {
        type: Date,
        immutable: true,
        default: Date.now,
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
