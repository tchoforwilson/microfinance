import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';
import * as factory from './handlerFactory';
import database from '../config/database';

const User = database.user;

// fields to be excluded from query
const excludedFields = [
  'password',
  'passwordConfirm',
  'active',
  'passwordChangedAt',
  'updatedAt',
];

// fields to be updated in an update
const fields = [
  'firstname',
  'middlename',
  'lastname',
  'gender',
  'contact',
  'email',
  'address',
  'photo',
  'identity',
  'active',
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
        'This route is not for password updates. Please use /updateMyPassword',
        403
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(
    req.body,
    'firstname',
    'middlename',
    'lastname',
    'contact',
    'gender',
    'email',
    'address'
  );
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user document
  const updatedUser = await User.update(filteredBody, {
    where: { id: req.user.id },
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

export const createUser = factory.createOne(User, ...fields);
export const getUser = factory.getOne(User, ...excludedFields);
export const getAllUsers = factory.getAll(User);
export const updateUser = factory.updateOne(User, ...fields);
export const deleteUser = factory.deleteOne(User);
