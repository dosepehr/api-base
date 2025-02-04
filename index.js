const process = require('process');
const path = require('path');
process.on('uncaughtException', (err) => {
    console.log('uncaughtException 💥 shutting down');
    console.log(err);
    process.exit(1);
});

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
//* routes & error handling
const { globalErrorHandler } = require('./modules/Error/errorController');
const AppError = require('./utils/Classes/AppError');

//* security
const { rateLimit } = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const { xss } = require('express-xss-sanitizer');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const compression = require('compression');


const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 15 minutes
    message: 'Too many requests from this IP, please try again in an hour',
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});

//* database setup
require('dotenv').config();
require('./utils/funcs/connectDB');
//* express app
const app = express();
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use('/api', limiter);
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(
    hpp({
        whitelist: [],
    })
);
app.use(compression());
const corsWhitelist = [];
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g., Postman or server-to-server requests)
        if (!origin || corsWhitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Serving static files

app.use(express.static(path.join(__dirname, 'public')));
//* routes
app.route('/').all((_, res) => {
    res.status(200).json({
        status: true,
        message: 'welcome home:)',
    });
});

//* 404 route
app.all('*', async (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

//* error handling middleware
app.use(globalErrorHandler);

//* server setup
const port = process.env.PORT || 3000;
const server = app.listen(+port, () => {
    console.log(`Server is running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
    console.log('unhandledRejection 💥 shutting down');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
        console.log('💥 Process terminated');
    });
});
