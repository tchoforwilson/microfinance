"use strict";
import express from "express";
import * as sessionController from "./../controllers/sessionController.js";
const router = express.Router();

router.post("/open", sessionController.openSession);
router.patch("/close", sessionController.closeSession);

export default router;
