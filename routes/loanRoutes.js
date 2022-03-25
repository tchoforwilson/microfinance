"use strict";
import express from "express";
import * as authController from "./../controllers/authController.js";
import * as loanController from "./../controllers/loanController.js";

const router = express.Router();

router.use(authController.protect);

// Other route
// 1. For prepayment
router.route("/prepayment").patch(loanController.prepayment);

// 2. For loan recovery
router.route("/recover").patch(loanController.recover);

// 3. Sum all the unpaid loans
router.route("/sumUnpaidLoan").get(loanController.getSumUnPaidLoan);

router
  .route("/")
  .get(loanController.getAllLoans)
  .post(loanController.createLoan);
router
  .route("/:id")
  .get(loanController.getLoan)
  .patch(loanController.updateLoan)
  .delete(loanController.deleteLoan);
export default router;
