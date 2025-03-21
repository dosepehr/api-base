const express = require('express');
const {
    sendOtp,
    verifyOtp,
    getMe,
    completeUserData,
} = require('./authController');
const {
    protect,
    allowOnlyNotComplete,
} = require('../../utils/middlewares/auth');

const authRouter = express.Router();

authRouter.post('/sendOtp', sendOtp);
authRouter.post('/verifyOtp', verifyOtp);
authRouter.post('/completeUserData', allowOnlyNotComplete, completeUserData);
authRouter.get('/getMe', protect, getMe);

module.exports = authRouter;
