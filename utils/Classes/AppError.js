class AppError extends Error {
    constructor(message, statusCode, errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.status = false;
        this.errors = errors;
        this.isOperational = true; // errors that we make using this class

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;