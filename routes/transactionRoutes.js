"use strict";
import express from "express";
import * as authController from "./../controllers/authController.js";
import * as transactionController from "./../controllers/transactionController.js";

const router = express.Router();

router.use(authController.protect);

// perform monthly tariff from user
router
  .route("/performMonthlyTariff")
  .get(
    authController.restrictTo("manager"),
    transactionController.performMonthlyTariff
  );

// Credit user
router
  .route("/creditCollector")
  .post(
    authController.restrictTo("manager", "accountant"),
    transactionController.creditCollector
  );

// Deposit and Withdraw
router.route("/deposit").post(transactionController.deposit);
router.route("/withdraw").post(transactionController.withdraw);

// Get all transactions
router.route("/").get(transactionController.getTransactions);

router.route("/:id").get(transactionController.getTransaction);

// /:userId/transactions
// /:accountId/transactions
export default router;
