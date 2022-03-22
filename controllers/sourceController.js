"use strict";
import AppError from "../utils/appError.js";
import catchAsync from "./../utils/catchAsync.js";
import database from "./../config/database.js";
import * as statistic from "../utils/statistic.js";
import APIFeatures from "./../utils/apiFeatures.js";

const Source = database.source;
const Op = database.Sequelize.Op;

export const getTopSources = (req, res, next) => {
  req.query.limit = "5";
  req.query.order = "amount";
  req.query.attributes = "source_id,amount,balance,zone_id";
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
  const date = new Date();
  let dt =
    date.getFullYear() +
    "-" +
    (date.getMonth() + 1) +
    "-" +
    (date.getDay() + 5);

  // 2. Verify that we are not crediting source twice
  const data = await Source.findOne({
    where: {
      [Op.and]: [{ zone_id: req.body.zone_id }, { date: dt }],
    },
  });

  if (data) {
    return next(
      new AppError(
        `Source with zone ID ${req.body.zone_id} already created for Today! You might want to update source?`,
        400
      )
    );
  }

  // 2. Create source
  req.body.balance = req.body.amount;
  const source = await Source.create(req.body, {
    fields: ["amount", "balance", "zone_id"],
  });

  res.status(200).json({
    status: "success",
    data: {
      source,
    },
  });
});

export const getSource = catchAsync(async (req, res, next) => {
  // 1. Get source
  const source = await Source.findByPk(parseInt(req.params.id, 10));

  // 2. Check if source exist
  if (!source) {
    return next(new AppError("No source found with ID!", 404));
  }

  // 3. Get zone
  const zone = await source.getZone();

  const data = { ...source.dataValues, zone };
  res.status(201).json({
    status: "success",
    data: {
      data,
    },
  });
});

export const getSources = catchAsync(async (req, res, next) => {
  // 1. Get sources
  const features = new APIFeatures(Source, req.query)
    .filter()
    .ordered()
    .limitAttributes()
    .paginate();
  const sources = await features.query;

  if (!sources) {
    return next(new AppError("No data found!", 404));
  }

  res.status(201).json({
    status: "success",
    data: {
      sources,
    },
  });
});

export const updateSource = catchAsync(async (req, res, next) => {
  // 1. Get source
  const source = await Source.findByPk(req.params.id);

  // 2. Check if source exist
  if (!source) {
    return next(new AppError("No source found with this ID!", 404));
  }

  // 3. Check if the balance is zero
  if (source.balance !== source.amount) {
    return next(
      new AppError("Source already emptied, create a new source", 400)
    );
  }

  // 4. Update source
  await Source.update(req.body, {
    where: { source_id: req.params.id },
  });

  res.status(201).json({
    status: "success",
    data: {},
  });
});

export const deleteSource = catchAsync(async (req, res, next) => {
  // 1. Get source
  const source = await Source.findByPk(req.params.id);

  // 2. Check if source exist
  if (!source) {
    return next(new AppError("No row found with this ID!", 404));
  }

  // 3. Check if source balance is zero
  if (source.balance !== 0) {
    return next(new AppError(`Source balance ${source.balance}`, 400));
  }

  //4. Delete source
  await Source.destroy({
    where: { source_id: req.params.id },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});
