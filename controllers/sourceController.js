"use strict";
import AppError from "../utils/appError.js";
import catchAsync from "./../utils/catchAsync.js";
import database from "./../config/database.js";
import * as factory from "./handlerFactory.js";
import * as statistic from "../utils/statistic.js";

const Source = database.source;
const Account = database.account;
const Op = database.Sequelize.Op;

// fields to be considered for creation and update
const fields = ["amount", "zone"];

//fields to be excluded during query
const excludedFields = ["createdAt", "updatedAt"];

export const getTopSources = (req, res, next) => {
  req.query.limit = "5";
  req.query.order = "amount";
  req.query.attributes = "id,amount,zone";
  next();
};

export const getTotalSourceSumToday = catchAsync(async (req, res, next) => {
  // 1. Build sate
  const date = new Date();
  let dt =
    date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
  const filter = { date: dt }; // filter by the current day
  // 2. Get the sum
  const sum = await statistic.getSum(Source, "amount", filter);

  // 3. Get the count
  const count = await statistic.getCount(Source, "amount", filter);

  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    data: {
      sum,
      count,
    },
  });
});

export const getTotalSourceSumMonth = catchAsync(async (req, res, next) => {
  // 1. Build sate
  const date = new Date();
  const startDate =
    date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + "01";
  const endDate = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + "31";

  const filter = { date: { [Op.between]: [startDate, endDate] } }; // filter by the current day

  const results = await statistic.getMonthlyStatics(Source);

  // 2. Get the sum
  const sum = await statistic.getSum(Source, "amount", filter);

  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    data: {
      results,
      sum,
    },
  });
});

export const createSource = catchAsync(async (req, res, next) => {
  // 1. Create new source for the day
  const source = await Source.create(req.body, { fields });

  // 2. Get source account
  const sourceAccount = await Account.findOne({
    where: { [Op.and]: [{ name: "Source" }, { type: "source" }] },
  });

  // 3. Add amount to source account
  sourceAccount.balance += req.body.amount;

  // 4. Save result
  await sourceAccount.save();

  res.status(200).json({
    status: "success",
    data: {
      source,
      sourceAccount,
    },
  });
});

export const getSource = factory.getOne(Source, ...excludedFields);
export const getAllSources = factory.getAll(Source);
export const updateSource = factory.updateOne(Source, ...fields);

export const deleteSource = catchAsync(async (req, res, next) => {
  // 1. Get source
  const source = await Source.findByPk(req.params.id);

  // 2. Check if source exist
  if (!source) {
    return next(new AppError("No row found with this ID!", 404));
  }

  // 3. Get source account
  const sourceAccount = await Account.findOne({
    where: { [Op.and]: [{ name: "Source" }, { type: "source" }] },
  });

  //4. Delete source
  await Source.destroy({
    where: { id: req.params.id },
  });

  // 5. Add amount to source account
  sourceAccount.balance -= amount;

  // 6. Save result
  await sourceAccount.save();

  res.status(201).json({
    status: "success",
    data: sourceAccount,
  });
});
