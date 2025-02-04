const mongoose = require('mongoose');

const DB_URI = process.env.DB_URI;
mongoose
    .connect(DB_URI)
    .then(() => console.log('DB Connected!'))
    .catch((err) => console.log('db connection error : ', err));
