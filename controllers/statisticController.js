import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";

export const getDataSum = (Model, column) =>
  catchAsync(async (req, res, next) => {});

export const getWeeklyStatics = (Model, row) =>
  catchAsync(async (req, res, next) => {});

export const getMonthlyStatics = (Model, column, month) =>
  catchAsync(async (req, res, next) => {});
