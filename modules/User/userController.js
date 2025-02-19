const { addOne, getOne, getAll } = require('../Factory/factoryController');
const User = require('./userModel');

exports.addUser = addOne(User);

exports.getUser = getOne(User);
exports.getUsers = getAll(User, [], {
    key: 'users',
});
