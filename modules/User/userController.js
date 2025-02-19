const { addOne } = require('../Factory/factoryController');
const User = require('./userModel');

exports.addUser = addOne(User);
