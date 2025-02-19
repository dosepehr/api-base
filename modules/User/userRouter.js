const express = require('express');
const { addUser, getUser, getUsers } = require('./userController');

const userRouter = express.Router();

userRouter.route('/').post(addUser).get(getUsers);
userRouter.route('/:id').get(getUser);

module.exports = userRouter;
