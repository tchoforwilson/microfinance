"use strict";
import express from "express";
import * as authController from "./../controllers/authController.js";
import * as customerController from "../controllers/customerController.js";

const router = express.Router({ mergeParams: true });

router.use(authController.protect);
router
  .route("/")
  .post(
    authController.hasRight("createCustomer"),
    customerController.createCustomer
  )
  .get(
    authController.hasRight("getCustomers"),
    customerController.getCustomers
  );
router
  .route("/:id")
  .get(authController.hasRight("getCustomer"), customerController.getCustomer)
  .patch(
    authController.hasRight("updateCustomer"),
    customerController.updateCustomer
  )
  .delete(
    authController.hasRight("deleteCustomer"),
    customerController.deleteCustomer
  );

// ADD A NEW CUSTOMER ACCOUNT
router.post("/addAccount", customerController.addAccount);
// CLOSE CUSTOMER ACCOUNT
router.patch("/closeAccount/:id", customerController.closeAccount);

export default router;
