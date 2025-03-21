const expressAsyncHandler = require('express-async-handler');
const User = require('../User/userModel');
const OTP = require('../Otp/otpModel');
const { signToken } = require('../../utils/funcs/token');

exports.sendOtp = expressAsyncHandler(async (req, res, next) => {
    const { phone } = req.body;
    const currentUser = await User.findOne({ phone });
    if (currentUser) {
        if (currentUser.role == 'not-complete') {
            return res.status(403).json({
                message: 'Try to complete your data',
            });
        } else {
            return res.status(401).json({
                message: 'User exists, try to login',
            });
        }
    }

    const otpCode = Math.floor(10000 + Math.random() * 90000);

    const otp = await OTP.create({
        code: otpCode,
        phone,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000),
    });
    return res.status(200).json({
        status: true,
        data: otp,
    });
});

exports.verifyOtp = expressAsyncHandler(async (req, res, next) => {
    const { otp, phone } = req.body;
    const validOtp = await OTP.findOne({
        phone,
        code: otp,
        expiresAt: { $gt: new Date(Date.now() - 2 * 60 * 1000) },
    });
    if (!validOtp) {
        return res.status(400).json({ message: 'no user' });
    } else {
        const user = await User.create({
            phone,
            email: `user-email-${phone}@gmail.com`,
            name: ' ',
            role: 'not-complete',
            password: ' ',
            username: `user-name-${phone}`,
        });
        const token = signToken({ id: user._id });
        return res.status(200).json({ message: 'welcome', token });
    }
});

exports.completeData = expressAsyncHandler(async (req, res, next) => {
    const { email, name, password } = req.body;
    const user = req.user;
    user.email = email;
    user.name = name;
    user.password = password;
    user.role = 'user';
    await user.save();
    const token = signToken({ id: user._id });

    res.status(200).json({
        message: 'User data updated successfully',
        token,
    });
});

exports.completeDataSeller = expressAsyncHandler(async (req, res, next) => {
    const { email, name, password } = req.body;
    const user = req.user;
    user.email = email;
    user.name = name;
    user.password = password;
    user.role = 'seller';
    await user.save();
    const token = signToken({ id: user._id });

    res.status(200).json({
        message: 'User data updated successfully',
        token,
    });
});

exports.getMe = expressAsyncHandler(async (req, res, next) => {
    const user = req.user;

    return res.status(200).json({
        status: true,
        data: user,
    });
});