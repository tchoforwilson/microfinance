"use strict";
import fs from "fs";
import { DataTypes, Sequelize } from "sequelize";
import { config } from "dotenv";
import User from "./../../models/userModel.js";
import Customer from "./../../models/customerModel.js";
import Account from "./../../models/accountModel.js";
import Zone from "./../../models/zoneModel.js";
import Source from "./../../models/sourceModel.js";
import Transaction from "./../../models/transactionModel.js";
import Loan from "./../../models/loanModel.js";

config({ path: "./config.env" });

const sequelize = new Sequelize(
  process.env.DATABASE_DEV,
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_PASSWORD,
  {
    host: process.env.DATABASE_HOST,
    dialect: process.env.DIALECT,
    pool: {
      max: 8,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// define a database object that will contain all tables
const database = {};
database.Sequelize = Sequelize;
database.sequelize = sequelize;

database.user = User(sequelize, DataTypes);
database.zone = Zone(sequelize, DataTypes);
database.customer = Customer(sequelize, DataTypes);
database.account = Account(sequelize, DataTypes);
database.source = Source(sequelize, DataTypes);
database.transaction = Transaction(sequelize, DataTypes);
database.loan = Loan(sequelize, DataTypes);

database.sequelize.authenticate().then(() => {
  console.log("Connection successfully!");
});

// read data from JSON file

const users = JSON.parse(
  fs.readFileSync(new URL("users.json", import.meta.url), "utf-8")
);
const zones = JSON.parse(
  fs.readFileSync(new URL("zones.json", import.meta.url), "utf-8")
);
const customers = JSON.parse(
  fs.readFileSync(new URL("customers.json", import.meta.url), "utf-8")
);
const accounts = JSON.parse(
  fs.readFileSync(new URL("accounts.json", import.meta.url), "utf-8")
);
const sources = JSON.parse(
  fs.readFileSync(new URL("sources.json", import.meta.url), "utf-8")
);
const loans = JSON.parse(
  fs.readFileSync(new URL("loans.json", import.meta.url), "utf-8")
);

// ADD SOURCE ACCOUNT

const importSource = async () => {
  try {
    await database.account.create({
      id: 1,
      name: "Source",
      type: "source",
      balance: 1000000,
    });
    console.log("Source account created!");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// ADD MANAGER INTO DATABASE, THIS IS DONE IN PRODUCTION

const importManager = async () => {
  const manager = {
    id: 1,
    firstname: "Best",
    lastname: "Admin",
    gender: "male",
    identity: "000056891",
    contact: "+237655443320",
    email: "admin@example.com",
    role: "manager",
    address: "My address",
  };
  try {
    await database.user.create(manager);
    console.log("Manager successfully added!");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// IMPORT DATA INTO DB

const importData = async () => {
  try {
    await database.user.bulkCreate(users);
    await database.zone.bulkCreate(zones);
    await database.customer.bulkCreate(customers);
    await database.account.bulkCreate(accounts);
    //////////////////////////////
    await database.source.bulkCreate(sources);
    await database.loan.bulkCreate(loans);
    console.log("Data successfully imported!");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE DATA FROM DB

const deleteData = async () => {
  try {
    await database.loan.destroy({ where: {}, truncate: false });
    // await database.transaction.destroy({ where: {}, truncate: false });
    await database.source.destroy({ where: {}, truncate: false });
    await database.account.destroy({ where: {}, truncate: false });
    await database.customer.destroy({ where: {}, truncate: false });
    await database.zone.destroy({ where: {}, truncate: false });
    await database.user.destroy({ where: {}, truncate: false });
    console.log("Data successfully deleted!");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// RUNNING THE SCRIPT
if (process.argv[2] === "--source") {
  importSource();
} else if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
} else if (process.argv[2] === "--manager") {
  importManager();
}
