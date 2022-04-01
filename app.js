"use strict";
import express, { json, urlencoded } from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import sessionRouter from "./routes/sessionRoutes.js";
import userRouter from "./routes/userRoutes.js";
import zoneRouter from "./routes/zoneRoutes.js";
import customerRouter from "./routes/customerRoutes.js";
import accountRouter from "./routes/accountRoutes.js";
import sourceRouter from "./routes/sourceRoutes.js";
import transactionRouter from "./routes/transactionRoutes.js";
import loanRouter from "./routes/loanRoutes.js";
import AppError from "./utils/appError.js";
import globalErrorHandler from "./controllers/errorController.js";
const app = express();

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parser, reading data from body into req.body
app.use(json({ limit: "10kb" }));
app.use(urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// ROUTES
app.use("/api/v1/session", sessionRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/zones", zoneRouter);
app.use("/api/v1/customers", customerRouter);
app.use("/api/v1/accounts", accountRouter);
app.use("/api/v1/sources", sourceRouter);
app.use("/api/v1/transactions", transactionRouter);
app.use("/api/v1/loans", loanRouter);
// INVALID ROUTES
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

export default app;
