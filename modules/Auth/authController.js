const expressAsyncHandler = require('express-async-handler');
const User = require('../User/userModel');
const { signAccessToken } = require('../../utils/funcs/token');
const { hashPassword, comparePassword } = require('../../utils/funcs/password');
// const Email = require('../../utils/Classes/Email');
const { redisInit } = require('../../utils/funcs/db');

const client = redisInit();

exports.sendOtp = expressAsyncHandler(async (req, res, next) => {
    const { phone } = req.body;
    const currentUser = await User.findOne({ phone });
    const otp = await client.get(`${phone}-otp`);
    if (otp) {
        await client.set(`${phone}-otp-attempts`, 0, {
            EX: 2 * 60,
        });

        return res.status(400).json({
            message: 'OTP already sent',
        });
    }
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
    await client.set(`${phone}-otp`, otpCode, { EX: 2 * 60 });
    return res.status(200).json({
        status: true,
    });
});

exports.verifyOtp = expressAsyncHandler(async (req, res, next) => {
    const { phone, code } = req.body;
    const otp = await client.get(`${phone}-otp`);
    const attempts = parseInt(await client.get(`${phone}-otp-attempts`)) || 0;

    if (!otp) {
        return res.status(400).json({ message: 'no otp' });
    }
    if (otp != code) {
        if (attempts >= 5) {
            await client.del(`${phone}-otp`);
            await client.del(`${phone}-otp-attempts`);
            return res.status(429).json({
                status: false,
                message: 'Too many attempts. Please try again later.',
            });
        }

        await client.set(`${phone}-otp-attempts`, attempts + 1, {
            EX: 2 * 60,
        });

        return res.status(400).json({
            status: false,
            message: 'Invalid OTP code',
        });
    } else {
        const user = await User.create({
            phone,
            name: ' ',
            role: 'not-complete',
            password: ' ',
            username: `user-name-${phone}`,
        });
        const token = signAccessToken({ id: user._id });
        await client.del(`${phone}-otp`);
        return res.status(200).json({ message: 'welcome', token });
    }
});

exports.completeUserData = expressAsyncHandler(async (req, res, next) => {
    const JWT_ACCESS_EXPIRES = +process.env.JWT_ACCESS_EXPIRES.slice(0, 2);

    const { name, password } = req.body;
    const hashedPassword = await hashPassword(password);
    const user = req.user;
    await User.findByIdAndUpdate(user._id, {
        name,
        password: hashedPassword,
        role: 'user',
    });
    const token = signAccessToken({
        id: user._id,
    });
    res.cookie('auth', `Bearer ${token}`, {
        expires: new Date(
            Date.now() + JWT_ACCESS_EXPIRES * 24 * 60 * 60 * 1000
        ),
        secure: req.secure, // if https was on
        httpOnly: true,
    })
        .status(201)
        .json({
            status: true,
            token,
        });
    // await new Email({ email: 'spehdo@gmail.com' }, '').sendWelcome();
});

exports.login = expressAsyncHandler(async (req, res, next) => {
    const JWT_ACCESS_EXPIRES = +process.env.JWT_ACCESS_EXPIRES.slice(0, 2);

    const userData = {
        identifier: req.body.identifier,
        password: req.body.password,
    };
    // find a user that its email or username matchs identifier
    const user = await User.findOne({
        $or: [
            { phone: userData.identifier },
            // other props
        ],
    }).select('password');
    if (!user) {
        res.status(404).json({
            status: false,
            message: 'no user found',
        });
    }
    const canLogin = await comparePassword(userData.password, user.password);
    if (canLogin) {
        const token = signAccessToken({
            id: user._id,
        });
        return res
            .cookie('auth', `Bearer ${token}`, {
                expires: new Date(
                    Date.now() + JWT_ACCESS_EXPIRES * 24 * 60 * 60 * 1000
                ),
                secure: req.secure, // if https was on
                httpOnly: true,
            })
            .status(201)
            .json({
                status: true,
                token,
            });
        // await new Email({ email: 'spehdo@gmail.com' }, '').sendWelcome();
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

exports.logout = expressAsyncHandler(async (req, res, next) => {
    // Clear the auth cookie
    res.clearCookie('auth', {
        httpOnly: true,
        secure: req.secure,
        sameSite: 'strict',
        expires: new Date(0), // Set expiration to past date to ensure cookie is removed
    });

    return res.status(200).json({
        status: true,
        message: 'Successfully logged out',
    });
});

exports.requestPasswordReset = expressAsyncHandler(async (req, res, next) => {
    const { phone } = req.body;

    // Check if user exists
    const user = await User.findOne({ phone });
    if (!user) {
        return res.status(404).json({
            status: false,
            message: 'No user found with this phone number',
        });
    }

    // Check if there's an existing reset OTP
    const existingOtp = await client.get(`${phone}-reset-otp`);
    if (existingOtp) {
        return res.status(400).json({
            status: false,
            message:
                'Reset OTP already sent. Please wait before requesting again',
        });
    }

    // Generate and save reset OTP
    const resetOtpCode = Math.floor(10000 + Math.random() * 90000);
    await client.set(`${phone}-reset-otp`, resetOtpCode, {
        EX: 10 * 60, // 10 minutes expiry
    });

    // TODO: Send OTP via SMS service
    // For development, returning OTP in response
    return res.status(200).json({
        status: true,
        message: 'Password reset OTP sent successfully',
    });
});

exports.resetPassword = expressAsyncHandler(async (req, res, next) => {
    const { phone, otp, newPassword } = req.body;

    // Validate input
    if (!phone || !otp || !newPassword) {
        return res.status(400).json({
            status: false,
            message: 'Please provide phone, OTP and new password',
        });
    }

    // Check if user exists
    const user = await User.findOne({ phone });
    if (!user) {
        return res.status(404).json({
            status: false,
            message: 'No user found with this phone number',
        });
    }

    // Verify OTP
    const storedOtp = await client.get(`${phone}-reset-otp`);
    if (!storedOtp || storedOtp != otp) {
        return res.status(400).json({
            status: false,
            message: 'Invalid or expired OTP',
        });
    }

    // Hash new password and update user
    const hashedPassword = await hashPassword(newPassword);
    await User.findByIdAndUpdate(user._id, {
        password: hashedPassword,
    });

    // Clean up OTP
    await client.del(`${phone}-reset-otp`);

    // Generate new token
    const token = signAccessToken({ id: user._id });

    // Set cookie and return response
    const JWT_ACCESS_EXPIRES = +process.env.JWT_ACCESS_EXPIRES.slice(0, 2);
    return res
        .cookie('auth', `Bearer ${token}`, {
            expires: new Date(
                Date.now() + JWT_ACCESS_EXPIRES * 24 * 60 * 60 * 1000
            ),
            secure: req.secure,
            httpOnly: true,
            sameSite: 'strict',
        })
        .status(200)
        .json({
            status: true,
            message: 'Password reset successful',
            token,
        });
});

// !!!
// issues

// Add refresh token mechanism