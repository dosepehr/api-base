const jwt = require('jsonwebtoken');
const { promisify } = require('util');
require('dotenv').config();

const accessSecretKey = process.env.JWT_ACCESS_SECRET;
const refreshSecretKey = process.env.JWT_REFRESH_SECRET;

const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES;
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES;

exports.signAccessToken = (payload) => {
    const token = jwt.sign(payload, accessSecretKey, {
        expiresIn: accessExpiresIn,
    });
    return token;
};

exports.signRefreshToken = (payload) => {
    const token = jwt.sign(payload, refreshSecretKey, {
        expiresIn: refreshExpiresIn,
    });
    return token;
};

exports.verifyToken = async (token) =>
    await promisify(jwt.verify)(token, accessSecretKey);
