const expressAsyncHandler = require('express-async-handler');
const User = require('../User/userModel');
const OTP = require('../Otp/otpModel');
const { signAccessToken } = require('../../utils/funcs/token');
const { hashPassword } = require('../../utils/funcs/password');
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
            name: ' ',
            role: 'not-complete',
            password: ' ',
            username: `user-name-${phone}`,
        });
        const token = signAccessToken({ id: user._id });
        return res.status(200).json({ message: 'welcome', token });
    }
});

exports.signup = expressAsyncHandler(async (req, res, next) => {
    const JWT_ACCESS_SECRET = +process.env.JWT_ACCESS_SECRET.slice(0, 2);
    console.log(JWT_ACCESS_SECRET);
    const userData = {
        name: req.body.name,
        phone: req.body.phone,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
    };
    // hash password
    const hashedPassword = await hashPassword(req.body.password);
    userData.password = hashedPassword;
    userData.confirmPassword = undefined;
    const newUser = await User.create(userData);
    const token = signAccessToken({
        id: newUser._id,
    });
    // send token by cookie
    res.cookie('auth', `Bearer ${token}`, {
        expires: new Date(Date.now() + JWT_ACCESS_SECRET * 24 * 60 * 60 * 1000),
        secure: req.secure, // if https was on
        httpOnly: true,
    })
        .status(201)
        .json({
            status: true,
            token,
        });
    await new Email({ email: 'spehdo@gmail.com' }, '').sendWelcome();
});

exports.completeUserData = expressAsyncHandler(async (req, res, next) => {
    const { name, password } = req.body;
    const securePassword = await hashPassword(password);
    const user = req.user;
    await User.findByIdAndUpdate(user._id, {
        name,
        password: securePassword,
        role: 'user',
    });
    res.status(200).json({
        status: true,
        message: 'user data completed',
    });
});

exports.login = expressAsyncHandler(async (req, res, next) => {
    const JWT_ACCESS_SECRET = +process.env.JWT_ACCESS_SECRET.slice(0, 2);

    const userData = {
        identifier: req.body.identifier,
        password: req.body.password,
    };
    await loginUserSchema.validate(userData);
    // find a user that its email or username matchs identifier
    const user = await User.findOne({
        $or: [
            { email: userData.identifier },
            { username: userData.identifier },
        ],
    }).select('password ban');
    if (!user) {
        res.status(404).json({
            status: false,
            message: 'no user found',
        });
    }
    if (user.ban) {
        res.status(403).json({
            status: false,
            message: 'banned user',
        });
    }
    const canLogin = await comparePassword(userData.password, user.password);
    if (canLogin) {
        const token = signAccessToken({
            id: user._id,
        });
        res.cookie('auth', `Bearer ${token}`, {
            expires: new Date(
                Date.now() + JWT_ACCESS_SECRET * 24 * 60 * 60 * 1000
            ),
            secure: req.secure, // if https was on
            httpOnly: true,
        })
            .status(201)
            .json({
                status: true,
                token,
            });
        await new Email({ email: 'spehdo@gmail.com' }, '').sendWelcome();
    }
    res.status(404).json({
        status: false,
        message: 'no user found',
    });
});

exports.getMe = expressAsyncHandler(async (req, res, next) => {
    const user = req.user;

    return res.status(200).json({
        status: true,
        data: user,
    });
});
