"use strict";
import * as factory from "./handlerFactory.js";
import catchAsync from "./../utils/catchAsync.js";
import database from "./../config/database.js";

const Customer = database.customer;
const Account = database.account;

// fields to be excluded from query
const excludedFields = ["createdAt", "updatedAt"];

// fields to be updated in an update
const fields = [
  "firstname",
  "lastname",
  "gender",
  "contact",
  "email",
  "address",
  "photo",
  "identity",
  "zone",
  "active",
];

export const createCustomer = factory.createOne(Customer, ...fields);
export const getCustomer = factory.getOne(Customer, ...excludedFields);
export const getAllCustomers = factory.getAll(Customer);
export const updateCustomer = factory.updateOne(Customer, ...fields);
export const deleteCustomer = factory.deleteOne(Customer);

export const addCustomerAccount = catchAsync(async (req, res, next) => {
  // 1. Get customer id and account name
  const { name, customer } = req.body;

  // 2. Check if user exist
  const doc = await Customer.findByPk(customer);
  if (!doc) {
    return next(new AppError("User not found!", 404));
  }

  // 3. Create account
  const account = await Account.create({ name, customer });

  res.status(200).json({
    status: "success",
    data: {
      account,
    },
  });
});

export const closeAccount = factory.closeAccount(Account);
