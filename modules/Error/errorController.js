const AppError = require('../../utils/Classes/AppError');

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400, [`This ${err.path} is not correct`]);
};
const handleDuplicateFieldsDB = (err) => {
    const value = err.errorResponse.errmsg.match(/(["'])(\\?.)*?\1/)[0];

    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const dbError = Object.values(err.errors).map((el) => {
        if (el.kind === 'ObjectId' && el.reason?.name === 'BSONError') {
            return `The provided ${el.path} value ("${el.value}") is not a valid identifier.`;
        }
        return el.message || el;
    });

    const message = `Invalid input data.`;
    return new AppError(message, 400, dbError);
};

const handleJWTError = () => new AppError('Invalid token', 401);
const handleTokenExpiredError = () =>
    new AppError('your token has been expired', 401);
const sendErrorDev = (err, res) => {
    const statusCode = err.statusCode || 500;
    const error = err || 'Internal Server Error';
    res.status(statusCode).json({
        status: false,
        error,
        message: err.message,
        stack: err.stack,
    });
};

const sendErrorProd = (err, res) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    if (err.isOperational) {
        res.status(statusCode).json({
            status: false,
            message,
            errors: err.errors,
        });
        // programming or other unknown error: don't leak error details
    } else {
        console.log('ERROR 💥', err);
        res.status(statusCode).json({
            status: false,
            message: 'something went wrong',
        });
    }
};
exports.globalErrorHandler = (err, req, res, next) => {
    const NODE_ENV = process.env.NODE_ENV;
    if (NODE_ENV == 'dev') {
        sendErrorDev(err, res);
    } else if (NODE_ENV == 'prod') {
        let error = { ...err, message: err.message, name: err.name };
        console.log(error.message);
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError')
            error = handleValidationErrorDB(error);
        if (error.name == 'JsonWebTokenError') error = handleJWTError();
        if (error.name == 'TokenExpiredError')
            error = handleTokenExpiredError();
        sendErrorProd(error, res);
    }
};
