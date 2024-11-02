import AppError from '../utils/appError.js';

const handleDuplicateFieldsDB = (err) => {
  const { errors } = err;
  const error = errors[0];

  const message = `Duplicate field value: ${error.value}. ${error.message}, Please use another value!`;
  return new AppError(message, 400);
};

const handleForeignKeyError = (err) => {
  let { detail } = err.parent;
  detail = detail.replace('Key', '');
  detail = detail.replace('(', '');
  detail = detail.replace(')', '');
  detail = detail.replace('(', '');
  detail = detail.replace(')', '');
  detail = detail.replace(`"`, '');
  detail = detail.replace(`"`, '');

  const message = detail;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
};

const sendErrorTest = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
  }
};

export default (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'test') {
    sendErrorTest(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    let error = { ...err };
    error.message = err.message;
    if (error.name === 'SequelizeUniqueConstraintError')
      error = handleDuplicateFieldsDB(error);
    if (error.name === 'SequelizeForeignKeyConstraintError')
      error = handleForeignKeyError(error);
    if (error.name === 'SequelizeValidationError')
      error = handleValidationErrorDB(error);
    // if (error.name === "SequelizeDatabaseError") error = handleDatabaseError();
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(error, req, res);
  }
};
