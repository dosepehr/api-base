const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
    {
        code: {
            type: Number,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        timestamps: true,
    }
);

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;