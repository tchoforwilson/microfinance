import { DataTypes, Sequelize } from 'sequelize';
import config from './config.js';
import User from '../models/userModel.js';
import Customer from '../models/customerModel.js';
import Account from '../models/accountModel.js';
import Zone from '../models/zoneModel.js';
import Transaction from '../models/transactionModel.js';

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

/** ******************************* */
/** **********CREATE TABLES******** */
/** ******************************* */
database.zone = Zone(sequelize, DataTypes);
database.user = User(sequelize, DataTypes);
database.customer = Customer(sequelize, DataTypes);
database.account = Account(sequelize, DataTypes);
database.transaction = Transaction(sequelize, DataTypes);

export default database;
