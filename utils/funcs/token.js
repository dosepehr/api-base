const jwt = require('jsonwebtoken');
const { promisify } = require('util');
require('dotenv').config();

const secretKey = process.env.JWT_SECRET;
const expiresIn = process.env.JWT_EXPIRES;

exports.signToken = (payload) => {
    const token = jwt.sign(payload, secretKey, {
        expiresIn,
    });
    return token;
};

exports.verifyToken = async (token) =>
    await promisify(jwt.verify)(token, secretKey);
