"use strict";
import express from "express";
import * as authController from "./../controllers/authController.js";
import * as loanController from "./../controllers/loanController.js";

const router = express.Router();

router.use(authController.protect);

router
  .route("/")
  .get(loanController.getAllLoans)
  .post(loanController.createLoan);
router
  .route("/:id")
  .get(loanController.getLoan)
  .patch(loanController.updateLoan)
  .delete(loanController.deleteLoan);

// Other route
// 1. For prepayment
router.route("/prepayment").post(loanController.prepayment);
// 2. For loan recovery
//router.route("/prepayment").post(loanController.prepayment);

export default router;
