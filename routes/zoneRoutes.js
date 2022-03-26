"use strict";
import express from "express";
import customerRouter from "./customerRoutes.js";
import * as zoneController from "./../controllers/zoneController.js";
import * as authController from "./../controllers/authController.js";

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

// GET /zone/1/customers
router.use("/:zoneId/customers", customerRouter);

router.use(authController.restrictTo("manager"));
router
  .route("/")
  .post(zoneController.createZone)
  .get(zoneController.getAllZones);
router
  .route("/:id")
  .get(zoneController.getZone)
  .patch(zoneController.updateZone)
  .delete(zoneController.deleteZone);

export default router;
