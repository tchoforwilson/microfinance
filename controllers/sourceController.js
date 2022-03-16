"use strict";
import AppError from "../utils/appError.js";
import catchAsync from "./../utils/catchAsync.js";
import database from "./../config/database.js";
import APIFeatures from "./../utils/apiFeatures.js";

const Source = database.source;
const Op = database.Sequelize.Op;

export const getTopSources = (req, res, next) => {
  req.query.limit = "5";
  req.query.order = "amount";
  req.query.attributes = "source_id,amount,balance,zone_id";
  next();
};

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

  // 2. Create source
  req.body.balance = req.body.amount;
  const source = await Source.create(req.body, {
    fields: ["amount", "balance", "zone_id"],
  });

  if (data) {
    return next(
      new AppError(
        `Source with zone ID ${req.body.zone_id} already created for Today! You might want to update source?`,
        400
      )
    );
  }

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
  // 1. Update source
  const source = await Source.update(req.body, {
    where: { source_id: parseInt(req.params.id, 10) },
  });

  if (source[0] === 0) {
    return next(new AppError("No source found with this ID!", 404));
  }

  res.status(201).json({
    status: "success",
    data: {},
  });
});

export const deleteSource = catchAsync(async (req, res, next) => {
  //1. Delete source
  const source = await Source.destroy({
    where: { source_id: parseInt(req.params.id, 10) },
  });

  if (source[0] === 0) {
    return next(new AppError("No row found with this ID!", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
