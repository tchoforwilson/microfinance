"use strict";
import AppError from "./../utils/appError.js";
import catchAsync from "./../utils/catchAsync.js";
import APIFeatures from "../utils/apiFeatures.js";
import database from "./../config/database.js";
const Account = database.account;
const Zone = database.zone;
const Op = database.Sequelize.Op;

// fields to be excluded from query
const excludedFields = [
  "password",
  "password_confirm",
  "active",
  "password_changed_at",
  "createdAt",
  "updatedAt",
];

// fields to be updated in an update
const fields = [
  "firstname",
  "lastname",
  "gender",
  "contact",
  "email",
  "address",
  "role",
  "rights",
  "photo",
  "identity_number",
  "zone_id",
];

/**
 * Create a new single data in the Table
 * @param {Object} Model -> The table on which data we are trying to create
 * @param {String} accountType -> The accountType
 */
export const createOne = (Model, accountType) =>
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

    if (!doc) {
      return next(new AppError("Could not register account!", 500));
    }

    /**
     * Create account base on Model that is either a user or a customer
     */
    let account;
    accountType === "user"
      ? (account = await Account.create({
          account_name: req.body.account_name,
          type: accountType,
          user_id: doc.user_id,
        }))
      : (account = await Account.create({
          account_name: req.body.account_name,
          type: accountType,
          customer_id: doc.customer_id,
        }));

    if (!account) {
      return next(new AppError("Fail!", 500));
    }

    const data = { ...doc.dataValues, account };
    // SEND RESPONSE TO USER
    res.status(201).json({
      status: "success",
      data: {
        data,
      },
    });
  });

/**
 * Get a single row from the database in a table
 * @param {Object} Model -> Query table
 * @param  {String} type  -> Account type (User, Customer)
 * @returns Object
 */
export const getOne = (Model, type) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByPk(parseInt(req.params.id, 10), {
      attributes: { exclude: excludedFields },
    });
    if (!doc) {
      return next(new AppError("No document found with this ID!", 404));
    }

    /**
     * If it is a user, get one account
     * But a customer has many account
     */
    let account = {};
    let zones;
    if (type === "user") {
      account = await doc.getAccount();
      zones = await doc.getZones();
    } else {
      account = await doc.getAccounts();
    }

    // destructor data
    let docData = doc.dataValues;
    docData = { ...docData, account, zones };

    res.status(200).json({
      status: "success",
      data: {
        data: docData,
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
    // EXECUTE QUERY
    const features = new APIFeatures(Model, req.query)
      .filter()
      .ordered()
      .limitAttributes()
      .paginate();

    const docs = await features.query;

    if (!docs) {
      return next(new AppError("No documents found!", 404));
    }

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: docs.length,
      data: {
        docs,
      },
    });
  });

/**
 * Update a single row in the database from a table
 * @param {Object} Model  -> Table
 * @param {String} Type -> Table type (customer or user)
 * @returns Object
 */
export const updateOne = (Model, Type) =>
  catchAsync(async (req, res, next) => {
    let doc = [];

    /**
     * If there is a body role, means we are updating user else we are updating a customer
     */
    if (Type === "user") {
      // Update user information
      doc = await Model.update(req.body, {
        where: { user_id: parseInt(req.params.id, 10) },
        fields,
      });
      // if account info, update account
      if (req.body.account_name)
        doc = await Account.update(req.body, {
          where: { user_id: parseInt(req.params.id, 10) },
          fields: ["account_name"],
        });
    } else {
      // Update customer information
      doc = await Model.update(req.body, {
        where: { customer_id: parseInt(req.params.id, 10) },
        fields,
      });
      // if account info, update account
      //TODO: customer account should not be updated here, since customer have many accounts
      // if (req.body.account_name)
      //   doc = await Account.update(req.body, {
      //     where: { customer_id: parseInt(req.params.id, 10) },
      //     fields: ["account_name"],
      //   });
    }

    // 4. Find user with the ID, then use it to update address
    doc = await Model.findByPk(parseInt(req.params.id, 10));

    // check if document was updated
    if (doc[0] === 0) {
      return next(new AppError("No document found with this ID!", 404));
    }

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      data: null,
    });
  });

/**
 * Delete a single row from the database
 * @param {Object} Model -> The Table which the row will be deleted from
 * @param {String} type  -> The table type (user or customer table)
 * @returns
 */
export const deleteOne = (Model, type) =>
  catchAsync(async (req, res, next) => {
    // 1. Set the user of customer to inactive
    let doc;
    if (type === "user") {
      doc = await Model.update(
        { active: false },
        { where: { user_id: req.params.id } }
      );
      const account = await Account.findOne({
        where: { user_id: req.params.id },
      });
      // Deactivate account
      if (account) {
        account.active = false;
        await account.save();
      }
    } else {
      doc = await Model.update(
        { active: false },
        { where: { customer_id: req.params.id } }
      );
    }

    if (doc[0] === 0) {
      return next(new AppError("No document found with this ID!", 404));
    }

    // SEND RESPONSE
    res.status(204).json({
      status: "success",
      data: null,
    });
  });
