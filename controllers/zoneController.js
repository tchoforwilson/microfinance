"use strict";
import AppError from "./../utils/appError.js";
import catchAsync from "./../utils/catchAsync.js";
import * as factory from "./handleFactory.js";
import database from "./../config/database.js";
const Zone = database.zone;

export const createZone = catchAsync(async (req, res, next) => {
  // 1. Create zone
  const zone = await Zone.create(req.body, {
    fields: ["name", "description", "longitude", "latitude", "user_id"],
  });

  res.status(201).json({
    status: "success",
    data: zone,
  });
});

export const getZone = catchAsync(async (req, res, next) => {
  const zone = await Zone.findByPk(parseInt(req.params.id, 10));
  if (!zone) {
    return next(new AppError("No zone found with this id!", 404));
  }

  let zoneData = zone.dataValues;
  // Get collector for zone
  const user = await zone.getUser();

  zoneData = { ...zoneData, user };

  res.status(200).json({
    status: "success",
    data: {
      data: zone,
    },
  });
});

export const getZones = factory.getAll(Zone);

export const updateZone = catchAsync(async (req, res, next) => {
  const zone = await Zone.update(req.body, {
    where: { zone_id: parseInt(req.params.id, 10) },
  });

  if (zone[0] === 0) {
    return next(new AppError("No zone found with this ID!", 404));
  }

  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    data: zone,
  });
});

export const deleteZone = catchAsync(async (req, res, next) => {
  const zone = await Zone.destroy({
    where: { zone_id: parseInt(req.params.id, 10) },
  });
  if (zone === 0) {
    return next(new AppError("No zone found with this ID!", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
