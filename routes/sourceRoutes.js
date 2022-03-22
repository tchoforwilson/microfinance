"use strict";
import express from "express";
import * as authController from "./../controllers/authController.js";
import * as sourceController from "./../controllers/sourceController.js";

const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo("manager", "accountant"));

router.route("/daily-source").get(sourceController.getTotalSourceSumToday);
router.route("/monthly-source/").get(sourceController.getTotalSourceSumMonth);
// router.route("/yearly-source").get()

router
  .route("/")
  .post(sourceController.createSource)
  .get(sourceController.getTopSources, sourceController.getSources);
router
  .route("/:id")
  .get(sourceController.getSource)
  .patch(sourceController.updateSource)
  .delete(sourceController.deleteSource);

export default router;
