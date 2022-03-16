"use strict";
import AppError from "./../utils/appError.js";
import catchAsync from "./../utils/catchAsync.js";
import * as factory from "./handleFactory.js";
import database from "./../config/database.js";
const Customer = database.customer;
const Account = database.account;

export const createCustomer = factory.createOne(Customer, "customer");
export const getCustomer = factory.getOne(Customer, "customer");
export const getCustomers = factory.getAll(Customer);
export const updateCustomer = factory.updateOne(Customer, "customer");
export const deleteCustomer = factory.deleteOne(Customer, "customer");

export const addAccount = catchAsync(async (req, res, next) => {
  const account = await Account.create(req.body, {
    fields: ["account_name", "customer_id"],
  });
  if (!account) {
    return next(new AppError("Couldn't create account!", 400));
  }

  // SEND RESPONSE
  res.status(201).json({
    status: "success",
    data: account,
  });
});

export const closeAccount = catchAsync(async (req, res, next) => {
  // 1. Find account
  const account = await Account.findByPk(parseInt(req.params.id, 10));

  // 2. Check if it exists
  if (!account) {
    return next(new AppError("No account found with this ID!", 404));
  }

  // 3. set to inactive
  account.active = false;
  account.date_closed = Date.now();
  await account.save();

  // SEND RESPONSE
  res.status(201).json({
    status: "success",
    data: account,
  });
});
