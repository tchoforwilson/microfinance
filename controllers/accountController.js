"use strict";
import database from "../config/database.js";
import catchAsync from "./../utils/catchAsync.js";
import * as factory from "./handlerFactory.js";
import * as statistic from "../utils/statistic.js";

const Account = database.account;

export const setCustomerId = (req, res, next) => {
  if (!req.body.customer) req.body.customer = req.params.id;
  next();
};

export const getSumAllCustomersBalance = catchAsync(async (req, res, next) => {
  // 1. Get Sum
  const sum = await statistic.getSum(Account, "balance", {
    type: "customer",
  });

  res.status(200).json({
    status: "success",
    data: {
      totalAmount: sum,
    },
  });
});

export const getAllAccounts = factory.getAll(Account);
export const getAccount = factory.getOne(Account, "active");
export const updateAccount = factory.updateOne(Account, "name", "active");
