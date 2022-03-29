"use strict";
import express from "express";
import * as authController from "./../controllers/authController.js";
import * as accountController from "./../controllers/accountController.js";

const router = express.Router({ mergeParams: true });

// Protect all routes after this middleware
router.use(authController.protect);

router
  .route("/sumAllCustomersBalance")
  .get(accountController.getSumAllCustomersBalance);

router.route("/").get(accountController.getAllAccounts);
router
  .route("/:id")
  .get(accountController.getAccount)
  .patch(accountController.updateAccount)
  .delete(accountController.deleteAccount);

export default router;
