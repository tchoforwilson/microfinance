"use strict";
import request from "supertest";
import * as RandomVal from "./../../testUtilities/GenRandomVal.js";
import * as UnitTest from "./../../testUtilities/unit_testbases.js";
import {
  createAdminUser,
  getHeader,
  createSourceAccount,
} from "./../../testUtilities/testUtils.js";
import database from "./../../../config/database.js";

const User = database.user;
const Zone = database.zone;
const Customer = database.customer;
const Account = database.account;
const Transaction = database.transaction;
const Op = database.Sequelize.Op;

describe("TransactionController_Tests", () => {
  const MAX = 32;
  const MIN = 12;
  // define variables globally needed
  let server;
  let adminUser = {};
  let header;
  let sourceAccount;
  // 1. Call the server
  beforeAll(async () => {
    const mod = await import("../../../index");
    server = mod.default;
    await User.sequelize.authenticate();
    await Zone.sequelize.authenticate();
    await Customer.sequelize.authenticate();
    await Account.sequelize.authenticate();
    await Transaction.sequelize.authenticate();
    adminUser = await createAdminUser("manager");
    sourceAccount = await createSourceAccount();
    header = getHeader(adminUser);
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
    await User.destroy({
      where: {},
      truncate: false,
    });
    // close all database connections
    await database.sequelize.close();
  });
  beforeEach(async () => {
    // credit the source account
    sourceAccount.balance = RandomVal.GenRandomBigAmount();
    await sourceAccount.save();
  });
  afterEach(async () => {
    await Transaction.destroy({ where: {}, truncate: false });
    await Account.destroy({ where: {}, truncate: false });
    await Customer.destroy({ where: {}, truncate: false });
    await Zone.destroy({
      where: {},
      truncate: false,
    });
    await User.destroy({
      where: { [Op.not]: [{ id: adminUser.id }] },
      truncate: false,
    });
  });
  describe("POST /api/v1/transactions/creditCollector", () => {
    it("Test_CreditCollector It should return 400 for insufficient funds in the source account", async () => {
      // 1. Generate random number as id
      const id = RandomVal.GenRandomInteger(MAX);
      // 2. Generate and amount greater than source account balance
      const amount = RandomVal.GenRandomBigAmount() * 4;
      // 3. Send request
      const res = await request(server)
        .post("/api/v1/transactions/creditCollector")
        .set("Authorization", header)
        .send({ amount, collector: id });
      // 4. expect result
      expect(res.status).toBe(400);
    });
    it("Test_CreditCollector It should return 404 if the collector is not found", async () => {
      // 1. Generate random number as collector id
      const id = RandomVal.GenRandomInteger(MAX);
      // 2. Generate random valid amount
      const amount = RandomVal.GenRandomSmallAmount();
      // 3. Send request
      const res = await request(server)
        .post("/api/v1/transactions/creditCollector")
        .set("Authorization", header)
        .send({ amount, collector: id });
      // 4. expect result
      expect(res.status).toBe(404);
    });
  });
});
