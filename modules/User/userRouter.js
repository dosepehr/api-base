const express = require('express');
const { addUser } = require('./userController');

const userRouter = express.Router();

userRouter.route('/').post(addUser);

module.exports = userRouter;
