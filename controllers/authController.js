import jwt from 'jsonwebtoken';
import { promisify } from 'es6-promisify';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';
import database from '../config/database';

const User = database.user;
const { Op } = database.Sequelize;

/**
 * Generate a sign token
 * @param {String} id -> Token payload
 * @returns Object
 */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

/**
 * Create the and send the generated token to the user when login
 * @param {Object} user  -> user from which token will be generated
 * @param {Number} statusCode  -> Response status code
 * @param {Object} res  -> Response
 */
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);
  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

export const signup = catchAsync(async (req, res, next) => {
  // 1. Get user information
  const { email, password, passwordConfirm } = req.body;

  // 2. Check user information
  if (!email) {
    return next(new AppError('Please enter email!', 400));
  }
  if (!password) {
    return next(new AppError('Please enter password!', 400));
  }
  if (!passwordConfirm) {
    return next(new AppError('Please confirm password!', 400));
  }
  if (password !== passwordConfirm) {
    return next(new AppError('Passwords are not the same!', 400));
  }

  // 2. Find user based on email
  const user = await User.findOne({
    where: {
      [Op.or]: [{ email }, { contact: email }],
    },
    attributes: [
      'id',
      'firstname',
      'lastname',
      'gender',
      'email',
      'role',
      'address',
      'contact',
      'password',
    ],
  });

  // 3. User doesn't exist, means not registered
  if (!user) {
    return next(new AppError('You are not yet registered!', 404));
  }

  // Get the values
  const userData = user.dataValues;

  // 4. Presence of password means user login
  if (userData.password) {
    return next(new AppError('Already registered! Please login', 403));
  }

  // Save user password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();
  createSendToken(userData, 201, res);
});

export const signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password provided
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if user exists with email
  const user = await User.findOne({
    where: { [Op.or]: [{ email }, { contact: email }] },
    attributes: {
      exclude: ['passwordConfirm', 'passwordChangedAt'],
    },
  });

  // 3) Return error if user doesn't exist
  if (!user) {
    return next(new AppError('Not registered!', 404));
  }

  // Don't log inactive users
  if (!user.active) {
    return next(new AppError('Access denied!', 403));
  }

  const userData = user.dataValues;

  // 3) if password is null, user need to signup
  if (!userData.password) {
    return next(new AppError('Please signup!', 400));
  }

  if (!(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  createSendToken(userData, 200, res);
});

export const protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token || token === null) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2. verify token
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
  } catch {
    return next(new AppError('Invalid request token,please log in again', 500));
  }
  // 3) Check if user still exists
  const currentUser = await User.findByPk(decoded.id, {
    attributes: [
      'id',
      'firstname',
      'lastname',
      'email',
      'role',
      'address',
      'contact',
    ],
  });
  if (!currentUser) {
    return next(new AppError("User doesn't exist!", 404));
  }
  // TODO: Do we need to get the user zone here?
  // currentUser.zones = await currentUser.getZones();

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat, currentUser)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // 5. GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

export const updateMyPassword = catchAsync(async (req, res, next) => {
  // 1. Get passwords
  const { currentPassword, password, passwordConfirm } = req.body;
  // a. Check for currentPassword
  if (!currentPassword) {
    return next(new AppError('Current password required', 400));
  }

  // 2. Check passwords
  const user = await User.findByPk(req.user.id);

  // 3. check password
  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong!', 401));
  }

  // 4. Check passwords
  if (password !== passwordConfirm) {
    return next(
      new AppError("Confirmed password doesn't match password!", 400)
    );
  }
  // save new password
  // 5) If so, update password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  // 6. Log in user and send JWT
  createSendToken(user, 200, res);
});

export const restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles ['manager', 'accountant']. role='collector'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
