"use strict";
import express from "express";
import * as authController from "./../controllers/authController.js";
import * as transactionController from "./../controllers/transactionController.js";

const router = express.Router();

router.use(authController.protect);

// Credit a self
router
  .route("/creditMe")
  .post(
    authController.restrictTo("manager", "accountant"),
    transactionController.creditMe
  );

// Credit user
router
  .route("/creditUser")
  .post(
    authController.restrictTo("manager", "accountant"),
    transactionController.creditUser
  );

// Deposit and Withdraw
router.route("/deposit").post(transactionController.deposit);
router.route("/withdraw").post(transactionController.withdraw);

// Get all withdrawal
router.route("/").get(transactionController.getTransactions);

router
  .route("/:id")
  .get(transactionController.getTransaction)
  .delete(transactionController.deleteTransaction);

// Statistical routes

router
  .route("/sum")
  .post(
    authController.restrictTo("manager"),
    transactionController.sumTransactions
  );

// /:userId/transactions
// /:accountId/transactions
export default router;
