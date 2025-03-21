const express = require('express');
const {
    sendOtp,
    verifyOtp,
    completeData,
    getMe,
    completeDataSeller,
} = require('./authController');
const { protect } = require('../../utils/middlewares/auth');

const authRouter = express.Router();

authRouter.post('/sendOtp', sendOtp);
authRouter.post('/verifyOtp', verifyOtp);
authRouter.post('/completeData', protect, completeData);
authRouter.post('/completeDataSeller', protect, completeDataSeller);
authRouter.get('/getMe', protect, getMe);

module.exports = authRouter;
