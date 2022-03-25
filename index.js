"use strict";
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err);
  process.exit(1);
});

import app from "./app.js";
import { connectDB } from "./config/connect.js";

// connect to the database if we are in development or production
const env = process.env.NODE_ENV;

if (env === "production") {
  await connectDB(env, {});
}
if (env === "development") {
  await connectDB(env, {});
}

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}....`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLER REJECTION! 💥 Shutting down...");
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
export default server;
