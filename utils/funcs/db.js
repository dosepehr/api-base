const mongoose = require('mongoose');
const redis = require('redis');

const mongoDBInit = () => {
    const DB_URI = process.env.DB_URI;
    mongoose
        .connect(DB_URI)
        .then(() => console.log('Mongo Connected!'))
        .catch((err) => console.log('Mongo connection error : ', err));
};

const redisInit = () => {
    const client = redis.createClient();

    client.on('error', (err) => console.log('Redis connection error : ', err));
    client.connect().then(() => console.log('Redis Connected!'));
    return client;
};

module.exports = { mongoDBInit, redisInit };
