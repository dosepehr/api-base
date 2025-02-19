const mongoose = require('mongoose');
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
            lowercase: true,
        },
        role: {
            type: String,
            enum: ['not-complete', 'user', 'seller', 'admin'],
            default: 'user',
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        timestamps: true,
    }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
