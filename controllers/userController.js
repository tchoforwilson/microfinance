"use strict";
import AppError from "./../utils/appError.js";
import catchAsync from "./../utils/catchAsync.js";
import * as factory from "./../controllers/handlerFactory.js";
import database from "./../config/database.js";
const User = database.user;
const Account = database.account;

// fields to be excluded from query
const excludedFields = [
  "password",
  "passwordConfirm",
  "active",
  "passwordChangedAt",
  "createdAt",
  "updatedAt",
];

// fields to be updated in an update
const fields = [
  "firstname",
  "lastname",
  "gender",
  "contact",
  "email",
  "address",
  "role",
  "rights",
  "photo",
  "identity",
  "active",
];

/**
 * Filter an object by selecting the provide fields
 * @param {Object} obj -> The object to be filtered
 * @param  {...any} allowedFields  -> The fields to be pick from the object
 * @returns Object
 */
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

export const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

export const setUserId = (req, res, next) => {
  if (!req.body.user) req.body.user = req.params.id;
  next();
};

export const updateMe = catchAsync(async (req, res, next) => {
  // 1. Check of user post a password or passwordConfirm field
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword",
        403
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(
    req.body,
    "firstname",
    "lastname",
    "contact",
    "gender",
    "email",
    "address",
    "rights"
  );
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user document
  let updatedUser = await User.update(filteredBody, {
    where: { id: req.user.id },
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

export const createUser = factory.createOne(User, ...fields);
export const getUser = factory.getOne(User, ...excludedFields);
export const getAllUsers = factory.getAll(User);
export const updateUser = factory.updateOne(User, fields);
export const deleteUser = factory.deleteOne(User);

export const addUserAccount = catchAsync(async (req, res, next) => {
  // 1. Get user id and account name
  const { name, user } = req.body;

  // 2. Check if user exist
  const doc = await User.findByPk(user);
  if (!doc) {
    return next(new AppError("User not found!", 404));
  }

  // 3. Check that user is neither accountant nor Manager
  if (doc.role === "manager" || doc.role === "accountant") {
    return next(new AppError("Can add account for manager or accountant", 400));
  }

  // 4. Create account
  const account = await Account.create({ name, user });

  res.status(200).json({
    status: "success",
    data: {
      account,
    },
  });
});
export const closeAccount = factory.closeAccount(Account);
