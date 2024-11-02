import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import express, { json, urlencoded } from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import authRouter from "./routes/auth.routes.js";
import userRouter from './routes/user.routes.js';
import zoneRouter from './routes/zone.routes.js';
import customerRouter from './routes/customer.routes.js';
import accountRouter from './routes/account.routes.js';
import transactionRouter from './routes/transaction.routes.js';
import AppError from './utils/appError.js';
import globalErrorHandler from './controllers/error.controller.js';

const app = express();

// 1) GLOBAL MIDDLEWARES
// Serving static files
const __dirname = path.dirname(fileURLToPath(import.meta.url));
//app.use('/static',express.static(path.join(new URL('public', import.meta.url))));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser, reading data from body into req.body
app.use(json({ limit: '10kb' }));
app.use(urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

const corsOptions = {
  origin: process.env.API_ENDPOINT,
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.cookies);
  next();
});

// ROUTES
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/zones', zoneRouter);
app.use('/api/v1/customers', customerRouter);
app.use('/api/v1/accounts', accountRouter);
app.use('/api/v1/transactions', transactionRouter);
// INVALID ROUTES
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

export default app;
