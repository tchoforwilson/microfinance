"use strict";
import jwt from "jsonwebtoken";
import { promisify } from "es6-promisify";
import AppError from "./../utils/appError.js";
import catchAsync from "./../utils/catchAsync.js";
import database from "./../config/database.js";
const User = database.user;
const Account = database.account;
const Op = database.Sequelize.Op;

/**
 * Generate a sign token
 * @param {String} id -> Token payload
 * @returns Object
 */
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

/**
 * Get user account,
 * If user role is a manage or account, then the account is the source account
 * Else if it is a collector, then account is a collector{user} account
 * @param {Object} user
 * @returns {Object} account
 */
const getUserAccount = async (user) => {
  let account = null;
  if (user.role === "manager" || user.role === "accountant") {
    account = await Account.findOne({ where: { type: "source" } });
  } else {
    account = await Account.findOne({ where: { user: user.id } });
  }
  return account;
};

/**
 * Create the and send the generated token to the user when login
 * @param {Object} user  -> user from which token will be generated
 * @param {Number} statusCode  -> Response status code
 * @param {Object} res  -> Response
 */
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);
  const cookieOptions = {
    expires: new Date(
      Date.now() * process.env.JWT_COOKIE_EXPIRES_IN * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);
  //Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
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
    return next(new AppError("Please enter email!", 400));
  }
  if (!password) {
    return next(new AppError("Please enter password!", 400));
  }
  if (!passwordConfirm) {
    return next(new AppError("Please confirm password!", 400));
  }
  if (password !== passwordConfirm) {
    return next(new AppError("Passwords are not the same!", 400));
  }

  // 2. Find user based on email
  const user = await User.findOne({
    where: {
      [Op.or]: [{ email }, { contact: email }],
    },
    attributes: [
      "id",
      "firstname",
      "lastname",
      "gender",
      "email",
      "address",
      "role",
      "rights",
      "contact",
      "password",
    ],
  });

  // 3. User doesn't exist, means not registered
  if (!user) {
    return next(new AppError("You are not yet registered!", 404));
  }

  // Get the values
  let userData = user.dataValues;

  // 4. Presence of password means user login
  if (userData.password) {
    return next(new AppError("Already registered! Please login", 403));
  }

  /**
   * Get user account,
   * If user role is a manage or account, then the account is the source account
   * Else if it is a collector, then account is a collector{user} account
   */
  const account = await getUserAccount(user);
  userData = { ...userData, account };

  // Save user password
  await user.save();
  createSendToken(userData, 201, res);
});

export const signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password provided
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  // 2) Check if user exists with email
  const user = await User.findOne({
    where: { [Op.or]: [{ email }, { contact: email }] },
    attributes: {
      exclude: ["passwordConfirm", "passwordChangedAt"],
    },
  });

  // 3) Return error if user doesn't exist
  if (!user) {
    return next(new AppError("Not registered!", 404));
  }

  // Don't log inactive users
  if (!user.active) {
    return next(new AppError("Access denied!", 403));
  }

  let userData = user.dataValues;

  // 3) if password is null, user need to signup
  if (!userData.password) {
    return next(new AppError("Please signup!", 400));
  }

  if (!userData || !(await user.correctPassword(password, userData.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  const account = await getUserAccount(userData);
  userData = { ...userData, account };
  createSendToken(userData, 200, res);
});

export const logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

export const protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token || token === null) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  //2. verify token
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  } catch {
    return next(new AppError("Invalid request token,please log in again", 500));
  }
  // 3) Check if user still exists
  const currentUser = await User.findByPk(decoded.id, {
    attributes: [
      "id",
      "firstname",
      "lastname",
      "email",
      "address",
      "contact",
      "role",
      "rights",
    ],
  });
  if (!currentUser) {
    return next(new AppError("User doesn't exist!", 404));
  }
  currentUser.account = await getUserAccount(currentUser);
  //TODO: Do we need to get the user zone here?
  //currentUser.zones = await currentUser.getZones();

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat, currentUser)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  // 5. GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

export const updateMyPassword = catchAsync(async (req, res, next) => {
  //1. Get passwords
  const { currentPassword, password, passwordConfirm } = req.body;

  // 2. Check passwords
  const user = User.findByPk(req.user.id);

  // 3. check password
  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError("Your current password is wrong!", 401));
  }

  // 4. Check passwords
  if (password !== passwordConfirm) {
    return next(
      new AppError("Confirmed password doesn't match password!", 400)
    );
  }
  // save new password
  await user.save();

  // 5. Log in user and send JWT
  createSendToken(user, 200, res);
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['manager', 'accountant']. role='collector'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

export const hasRight = (right) => {
  return (req, res, next) => {
    if (!req.user.rights.includes(right)) {
      return next(
        new AppError("You don't have the right to perform this action", 403)
      );
    }
    next();
  };
};
