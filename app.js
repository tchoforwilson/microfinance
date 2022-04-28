"use strict";
import path from 'path';
import {fileURLToPath} from 'url';
import cors from "cors";
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

// 1) GLOBAL MIDDLEWARES
// Serving static files
const __dirname = path.dirname(fileURLToPath(import.meta.url));
//app.use('/static',express.static(path.join(new URL('public', import.meta.url))));
app.use('/public',express.static(path.join(__dirname, 'public')));

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parser, reading data from body into req.body
app.use(json({ limit: "10kb" }));
app.use(urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

const corsOptions = {
  origin: "http://localhost:3000",
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.cookies);
  next();
});

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
