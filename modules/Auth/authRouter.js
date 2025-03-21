const express = require('express');
const {
    sendOtp,
    verifyOtp,
    getMe,
    completeUserData,
    login,
} = require('./authController');
const {
    protect,
    allowOnlyNotComplete,
} = require('../../utils/middlewares/auth');

const authRouter = express.Router();

authRouter.post('/sendOtp', sendOtp);
authRouter.post('/verifyOtp', verifyOtp);
authRouter.post('/completeUserData', allowOnlyNotComplete, completeUserData);
authRouter.post('/login', login);
authRouter.get('/getMe', protect, getMe);

module.exports = authRouter;
