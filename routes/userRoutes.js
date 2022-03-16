"use strict";
import { Router } from "express";
import * as authController from "./../controllers/authController.js";
import * as userController from "./../controllers/userController.js";

const router = Router();

router.post("/signup", authController.signup);
router.post("/signin", authController.signin);
router.get("/logout", authController.logout);

// Protect all routes after this middleware
router.use(authController.protect);
router.patch("/updateMyPassword", authController.updateMyPassword);
router.get("/me", userController.getMe, userController.getUser);
//router.patch("/updateMe", userController.updateMe);
router
  .route("/updateMe")
  .patch(authController.restrictTo("manager"), userController.updateMe);

//router.use(authController.restrictTo("manager"));
router
  .route("/")
  .post(authController.hasRight("createUser"), userController.createUser)
  .get(authController.hasRight("getUsers"), userController.getUsers);
router
  .route("/:id")
  .get(authController.hasRight("getUsers"), userController.getUser)
  .patch(authController.hasRight("updateUser"), userController.updateUser)
  .delete(authController.hasRight("deleteUser"), userController.deleteUser);

export default router;
