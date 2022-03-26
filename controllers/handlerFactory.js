"use strict";
import AppError from "./../utils/appError.js";
import catchAsync from "./../utils/catchAsync.js";
import APIFeatures from "../utils/apiFeatures.js";

/**
 * Create a new single data in the Table
 * @param {Object} Model -> The table on which data we are trying to create
 * @param {Array} fields -> The fields allowed when creating a new document
 */
export const createOne = (Model, ...fields) =>
  catchAsync(async (req, res, next) => {
    /**
     * For registering a new user, make sure user role is not a manager
     */
    if (req.body.role && req.body.role === "manager") {
      return next(
        new AppError(`Invalid ${req.body.role} role specified!`, 400)
      );
    }

    /**
     * Create data in the Model
     */
    const doc = await Model.create(req.body, { fields });

    // SEND RESPONSE TO USER
    res.status(201).json({
      status: "success",
      data: {
        doc,
      },
    });
  });

/**
 * Get a single row from the database in a table
 * @param {Object} Model -> Query table
 * @param {Array} excludedFields -> fields to be excluded during query
 * @returns Object
 */
export const getOne = (Model, ...excludedFields) =>
  catchAsync(async (req, res, next) => {
    // 1. Get document from model
    const doc = await Model.findByPk(req.params.id, {
      attributes: { exclude: excludedFields },
    });

    // 2. Check if model exist
    if (!doc) {
      return next(new AppError("No document found with this ID!", 404));
    }

    // 3. Send response
    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

/**
 * Get all data in the database from a table
 * @param {Object} Model  -> Table
 * @returns Object
 */
export const getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET zone,user
    if (req.params.zoneId) req.query.zone = req.params.zoneId;
    if (req.params.userId) req.query.user = req.params.userId;
    if (req.params.customerId) req.query.customer = req.params.customerId;

    // EXECUTE QUERY
    const features = new APIFeatures(Model, req.query)
      .filter()
      .ordered()
      .limitAttributes()
      .paginate();

    const docs = await features.query;

    // CHECK IF RESULTS WAS FOUND
    if (docs.count === 0) {
      return next(new AppError("No documents found!", 404));
    }

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      data: {
        docs,
      },
    });
  });

/**
 * Update a single row in the database from a table
 * @param {Object} Model  -> Table
 * @param {Array} fields -> fields that are allowed to be updated
 * @returns Object
 */
export const updateOne = (Model, ...fields) =>
  catchAsync(async (req, res, next) => {
    // 1. Get document from model
    let doc = await Model.findByPk(req.params.id);

    // 2. Check if document exist
    if (!doc) {
      return next(new AppError("No document found with this ID!", 404));
    }

    // 3. Update document
    doc = await Model.update(req.body, {
      where: { id: req.params.id },
      fields,
    });

    // SEND RESPONSE
    res.status(201).json({
      status: "success",
      data: doc,
    });
  });

/**
 * Delete a single row from the database
 * @param {Object} Model -> The Table which the row will be deleted from
 * @returns
 */
export const deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // 1. Get document from the model
    const doc = await Model.findByPk(req.params.id);

    // 2. Check if it exists
    if (!doc) {
      return next(new AppError("No document found with this ID!", 404));
    }

    // 2. Set to inactive
    await Model.update({ active: false }, { where: { id: req.params.id } });

    // SEND RESPONSE
    res.status(204).json({
      status: "success",
      data: null,
    });
  });

export const closeAccount = (Model) =>
  catchAsync(async (req, res, next) => {
    // 1. Find account
    const account = await Model.findByPk(req.params.id);

    // 2. Check if it exists
    if (!account) {
      return next(new AppError("No account found with this ID!", 404));
    }

    // 3. Make sure it is not a source account
    if (account.type === "source") {
      return next(new AppError("Can't delete source account!", 400));
    }

    // 4. set to inactive
    account.active = false;
    account.dateClosed = Date.now();
    await account.save();

    // SEND RESPONSE
    res.status(201).json({
      status: "success",
      data: account,
    });
  });
