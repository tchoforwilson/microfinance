"use strict";
import AppError from "./../utils/appError.js";
import catchAsync from "./../utils/catchAsync.js";
import * as factory from "./../controllers/handleFactory.js";
import database from "./../config/database.js";
const User = database.user;
const Account = database.account;

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
  req.params.id = req.user.user_id;
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
    "email",
    "address",
    "account_name"
  );
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user document
  let updatedUser = await User.update(filteredBody, {
    where: { user_id: req.user.user_id },
  });

  // 6. Set user account
  if (filteredBody.account_name) {
    updatedUser = await Account.update(filteredBody, {
      where: { user_id: req.user.user_id },
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

export const createUser = factory.createOne(User, "user");
export const getUser = factory.getOne(User, "user");
export const getUsers = factory.getAll(User);
export const updateUser = factory.updateOne(User, "user");
export const deleteUser = factory.deleteOne(User, "user");
