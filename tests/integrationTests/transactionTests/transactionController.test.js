"use strict";
import request from "supertest";
import * as RandomVal from "../../testUtilities/GenRandomVal.js";
import * as UnitTest from "../../testUtilities/unit_testbases.js";
import {
  createAdminUser,
  getHeader,
  createSourceAccount,
} from "../../testUtilities/testUtils.js";
import database from "../../../config/database.js";

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
    await Account.destroy({ where: {}, truncate: false });
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
    await Account.destroy({
      where: { [Op.not]: [{ type: "source" }] },
      truncate: false,
    });
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
    it("Test_CreditCollector It should return 400 if the user is inactive", async () => {
      // 1. Generate and create random valid user
      // a. generate random user with password
      const genUser = UnitTest.GenRandomValidUserWithPassword();
      genUser.active = false; // set user to inactive
      // b. create user
      const user = await User.create(genUser);
      // 2. generate random small amount
      const amount = RandomVal.GenRandomSmallAmount();
      // 3. Send request
      const res = await request(server)
        .post("/api/v1/transactions/creditCollector")
        .set("Authorization", header)
        .send({ amount, collector: user.id });
      // 4. expect result
      expect(res.status).toBe(400);
    });
    it("Test_CreditCollector It should return 400 if the user is not a collector", async () => {
      // 1. Generate and create random valid user
      // a. generate random user with password
      const genUser = UnitTest.GenRandomValidUserWithPassword();
      genUser.role = "accountant"; // set user role to accountant
      // b. create user
      const user = await User.create(genUser);
      // 2. generate random small amount
      const amount = RandomVal.GenRandomSmallAmount();
      // 3. Send request
      const res = await request(server)
        .post("/api/v1/transactions/creditCollector")
        .set("Authorization", header)
        .send({ amount, collector: user.id });
      // 4. expect result
      expect(res.status).toBe(400);
    });
    it("Test_CreditCollector It should return 400 if the user account is closed", async () => {
      // 1. Generate and create random valid user
      // a. generate random user with password
      const genUser = UnitTest.GenRandomValidUserWithPassword();
      genUser.role = "collector"; // set user role to collector
      // b. create user
      const user = await User.create(genUser);
      // 2. Generate and create user account
      // a. generate user account
      const genUserAccount = UnitTest.GenRandomValidUserAccount(user.id);
      genUserAccount.active = false; // set account to inactive or false
      // b. create user account
      await Account.create(genUserAccount);
      // 3. generate random small amount
      const amount = RandomVal.GenRandomSmallAmount();
      // 4. Send request
      const res = await request(server)
        .post("/api/v1/transactions/creditCollector")
        .set("Authorization", header)
        .send({ amount, collector: user.id });
      // 5. expect result
      expect(res.status).toBe(400);
    });
    it("Test_CreditCollector It should return 200 if the collector is successfully credited", async () => {
      // 1. Generate and create random valid user
      // a. generate random user with password
      const genUser = UnitTest.GenRandomValidUserWithPassword();
      genUser.role = "collector"; // set user role to collector
      // b. create user
      const user = await User.create(genUser);
      // 2. Generate and create user account
      // a. generate user account
      const genUserAccount = UnitTest.GenRandomValidUserAccount(user.id);
      genUserAccount.balance = 0; //set balance to zero
      // b. create user account
      await Account.create(genUserAccount);
      // 3. generate random small amount
      const amount = RandomVal.GenRandomSmallAmount();
      // 4. Send request
      const res = await request(server)
        .post("/api/v1/transactions/creditCollector")
        .set("Authorization", header)
        .send({ amount, collector: user.id });
      // 5. expect result
      expect(res.status).toBe(200);
      const { data } = JSON.parse(res.text);
      expect(data.account.balance).toEqual(amount);
      expect(data.user.id).toEqual(data.account.user);
    });
  });
  describe("POST /api/v1/transactions/deposit", () => {
    it("Test_Deposit It should return 400 if the amount is less than 500 FCFA", async () => {
      // 1. Generate random number as account id
      const id = RandomVal.GenRandomInteger(MAX);
      // 2. Generate and integer amount between 100 and 400
      const amount = RandomVal.GenRandomIntegerInRange(100, 400);
      // 3. Send request
      const res = await request(server)
        .post("/api/v1/transactions/deposit")
        .set("Authorization", header)
        .send({ amount, account: id });
      // 4. expect result
      expect(res.status).toBe(400);
    });
    it("Test_Deposit It should return 400 if the creditor balance if insufficient", async () => {
      // 1. Generate random number as account id
      const id = RandomVal.GenRandomInteger(MAX);
      // 2. Generate and integer amount between 100 and 400
      const amount = RandomVal.GenRandomBigAmount() * 4;
      // 3. Send request
      const res = await request(server)
        .post("/api/v1/transactions/deposit")
        .set("Authorization", header)
        .send({ amount, account: id });
      // 4. expect result
      expect(res.status).toBe(400);
    });
    it("Test_Deposit It should return 404 if the account to deposit to is not found", async () => {
      // 1. Generate random number as account id
      const id = RandomVal.GenRandomInteger(MAX);
      // 2. Generate and integer amount between 100 and 400
      const amount = RandomVal.GenRandomSmallAmount();
      // 3. Send request
      const res = await request(server)
        .post("/api/v1/transactions/deposit")
        .set("Authorization", header)
        .send({ amount, account: id });
      // 4. expect result
      expect(res.status).toBe(404);
    });
    it("Test_Deposit It should return 400 if the customer account is inactive", async () => {
      // 1. Generate and create a valid zone
      // a. generate zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);
      // 2. Generate and create random valid customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customer
      const customer = await Customer.create(genCustomer);
      // 3. Generate and create a random valid customer account
      // a. generate account
      const genAccount = UnitTest.GenRandomValidCustomerAccount(customer.id);
      genAccount.active = false; // set account to inactive
      // b. create account
      const account = await Account.create(genAccount);
      // 4. Generate and integer amount between 100 and 400
      const amount = RandomVal.GenRandomSmallAmount();
      // 5. Send request
      const res = await request(server)
        .post("/api/v1/transactions/deposit")
        .set("Authorization", header)
        .send({ amount, account: account.id });
      // 6. expect result
      expect(res.status).toBe(400);
    });
    it("Test_Deposit It should return 400 if the account is not a customer account", async () => {
      // 1. Generate and create a valid zone
      // a. generate zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);
      // 2. Generate and create random valid customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customer
      const customer = await Customer.create(genCustomer);
      // 3. Generate and create a random valid customer account
      // a. generate account
      const genAccount = UnitTest.GenRandomValidCustomerAccount(customer.id);
      genAccount.type = "user"; // set account to a user account
      // b. create account
      const account = await Account.create(genAccount);
      // 4. Generate and integer amount between 100 and 400
      const amount = RandomVal.GenRandomSmallAmount();
      // 5. Send request
      const res = await request(server)
        .post("/api/v1/transactions/deposit")
        .set("Authorization", header)
        .send({ amount, account: account.id });
      // 6. expect result
      expect(res.status).toBe(400);
    });
    it("Test_Deposit It should return 200 for a successful deposit into customer account", async () => {
      // 1. Generate and create a valid zone
      // a. generate zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);
      // 2. Generate and create random valid customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customer
      const customer = await Customer.create(genCustomer);
      // 3. Generate and create a random valid customer account
      // a. generate account
      const genAccount = UnitTest.GenRandomValidCustomerAccount(customer.id);
      genAccount.balance = 0; // set account balance to zero
      // b. create account
      const account = await Account.create(genAccount);
      // 4. Generate and integer amount between 100 and 400
      const amount = RandomVal.GenRandomSmallAmount();
      // 5. Send request
      const res = await request(server)
        .post("/api/v1/transactions/deposit")
        .set("Authorization", header)
        .send({ amount, account: account.id });
      // 6. expect result
      expect(res.status).toBe(200);
      const { data } = JSON.parse(res.text);
      expect(data.transaction.type).toBe("deposit");
      expect(data.transaction.amount).toEqual(amount);
      // 7. Find customer account and check if same balance is present
      const customerAccount = await Account.findByPk(account.id);
      expect(customerAccount.balance).toEqual(amount);
    });
  });
  describe("POST /api/v1/transactions/withdraw", () => {
    it("Test_Withdraw It should return 404 for account not found", async () => {
      // 1. Generate random number as id
      const id = RandomVal.GenRandomInteger(MAX);
      // 2. Generate random small amount
      const amount = RandomVal.GenRandomSmallAmount();
      // 3. Send request
      const res = await request(server)
        .post("/api/v1/transactions/withdraw")
        .set("Authorization", header)
        .send({ amount, account: id });
      // 4. Expect result
      expect(res.status).toBe(404);
    });
    it("Test_Withdraw It should return 400 if the customer account is inactive", async () => {
      // 1. Generate and create a valid zone
      // a. generate zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);
      // 2. Generate and create random valid customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customer
      const customer = await Customer.create(genCustomer);
      // 3. Generate and create a random valid customer account
      // a. generate account
      const genAccount = UnitTest.GenRandomValidCustomerAccount(customer.id);
      genAccount.active = false; // set account to inactive
      // b. create account
      const account = await Account.create(genAccount);
      // 4. Generate and integer amount between 100 and 400
      const amount = RandomVal.GenRandomSmallAmount();
      // 3. Send request
      const res = await request(server)
        .post("/api/v1/transactions/withdraw")
        .set("Authorization", header)
        .send({ amount, account: account.id });
      // 4. Expect result
      expect(res.status).toBe(400);
    });
  });
});
