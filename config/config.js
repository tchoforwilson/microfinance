import { config } from "dotenv";
import environment from "../utils/environment.js";

config({ path: "./config.env" });

let DATABASE;
switch (process.env.NODE_ENV) {
  case environment.PROD:
    DATABASE = process.env.DATABASE_PROD;
    break;
  case environment.TEST:
    DATABASE = process.env.DATABASE_TEST;
    break;
  default:
    DATABASE = process.env.DATABASE_DEV;
}

const DatabaseConfig = {
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USERNAME,
  port: process.env.DATABASE_PORT,
  password: process.env.DATABASE_PASSWORD,
  database: DATABASE,
  dialect: process.env.DIALECT,
  pool: {
    max: 8,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

export default DatabaseConfig;
