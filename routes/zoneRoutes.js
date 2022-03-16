"use strict";
import { Router } from "express";
import * as zoneController from "./../controllers/zoneController.js";
import * as authController from "./../controllers/authController.js";
import customerRouter from "./customerRoutes.js";
const router = Router();

// GET /zone/1/customers
router.use("/:zoneId/customers", customerRouter);

router.use(authController.protect);
router.use(authController.restrictTo("manager"));
router.route("/").post(zoneController.createZone).get(zoneController.getZones);
router
  .route("/:id")
  .get(zoneController.getZone)
  .patch(zoneController.updateZone)
  .delete(zoneController.deleteZone);

export default router;
