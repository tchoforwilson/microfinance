"use strict";
import { DataTypes, Sequelize } from "sequelize";
import config from "./config.js";
import Session from "./../models/sessionModel.js";
import User from "./../models/userModel.js";
import Customer from "./../models/customerModel.js";
import Account from "../models/accountModel.js";
import Zone from "./../models/zoneModel.js";
import Source from "./../models/sourceModel.js";
import Transaction from "./../models/transactionModel.js";
import Loan from "./../models/loanModel.js";

// Configuring database connection
const sequelize = new Sequelize(config.database, config.user, config.password, {
  host: config.host,
  dialect: config.dialect,
  pool: {
    max: config.pool.max,
    min: config.pool.min,
    acquire: config.pool.acquire,
    idle: config.pool.idle,
  },
});

// define a database object that will contain all tables
const database = {};
database.Sequelize = Sequelize;
database.sequelize = sequelize;

/**********************************/
/************CREATE TABLES*********/
/**********************************/
database.session = Session(sequelize, DataTypes);
database.user = User(sequelize, DataTypes);
database.customer = Customer(sequelize, DataTypes);
database.account = Account(sequelize, DataTypes);
database.zone = Zone(sequelize, DataTypes);
database.source = Source(sequelize, DataTypes);
database.transaction = Transaction(sequelize, DataTypes);
database.loan = Loan(sequelize, DataTypes);

/**********************************/
/********DEFINE ASSOCIATIONS******/
/**********************************/

// A)USER and ZONE
/*user id in zone table*/
database.user.hasMany(database.zone, {
  foreignKey: {
    type: Sequelize.INTEGER,
    name: "user_id",
    allowNull: true,
  },
});
database.zone.belongsTo(database.user);

// B) ACCOUNT and USER
/*user id in account table*/
database.user.hasOne(database.account, {
  foreignKey: {
    type: Sequelize.INTEGER,
    name: "user_id",
  },
});
database.account.belongsTo(database.user);

// C) CUSTOMER AND ACCOUNT
/*customer id in account table*/
database.customer.hasMany(database.account, {
  foreignKey: {
    type: Sequelize.INTEGER,
    name: "customer_id",
  },
});
database.account.belongsTo(database.customer);

// D) ZONE AND CUSTOMER
/*zone id in customer table*/
database.zone.hasMany(database.customer, {
  foreignKey: {
    type: Sequelize.INTEGER,
    name: "zone_id",
    allowNull: false,
    validate: {
      notNull: {
        msg: "Customer zone required!",
      },
    },
  },
});
database.customer.belongsTo(database.zone);

// E) ZONE and SOURCE
/*zone id in source table*/
database.zone.hasOne(database.source);
database.source.belongsTo(database.zone, {
  foreignKey: {
    type: Sequelize.INTEGER,
    name: "zone_id",
    allowNull: false,
  },
});

// F) TRANSACTION AND ACCOUNT
/*user id in transaction table*/
database.account.hasMany(database.transaction, {
  foreignKey: {
    type: Sequelize.INTEGER,
    name: "account_id",
    allowNull: false,
  },
});
database.transaction.belongsTo(database.account);

// G) TRANSACTION AND USER
/*user id in transaction table*/
database.user.hasMany(database.transaction, {
  foreignKey: {
    type: Sequelize.INTEGER,
    name: "user_id",
    allowNull: false,
    validate: {
      notNull: {
        msg: "Transaction must involve a customer!",
      },
    },
  },
});
database.transaction.belongsTo(database.user);

// H) CUSTOMER AND LOAN
/*customer id in loan table*/
database.customer.hasOne(database.loan, {
  foreignKey: {
    type: Sequelize.INTEGER,
    name: "customer_id",
    allowNull: false,
    validate: {
      notNull: {
        msg: "Loan must belong to  customer!",
      },
    },
  },
});
database.loan.belongsTo(database.customer);

export default database;
