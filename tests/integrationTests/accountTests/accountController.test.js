"use strict";
import request from "supertest";
import * as RandomVal from "./../../testUtilities/GenRandomVal.js";
import * as UnitTest from "./../../testUtilities/unit_testbases.js";
import { createAdminUser, getHeader } from "./../../testUtilities/testUtils.js";
import database from "./../../../config/database.js";

const User = database.user;
const Zone = database.zone;
const Customer = database.customer;
const Account = database.account;
const Op = database.Sequelize.Op;

describe("AccountController_Tests", () => {
  const MAX = 32;
  const MIN = 12;
  // define variables globally needed
  let server;
  let adminUser = {};
  let header;
  // 1. Call the server
  beforeAll(async () => {
    const mod = await import("../../../index");
    server = mod.default;
    await User.sequelize.authenticate();
    await Zone.sequelize.authenticate();
    await Customer.sequelize.authenticate();
    await Account.sequelize.authenticate();
    adminUser = await createAdminUser("manager");
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
  afterEach(async () => {
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
  describe("GET /api/v1/accounts", () => {
    it("Test_GetAllAccounts It should return 404 for not found", async () => {
      // 1. Send request
      const res = await request(server)
        .get("/api/v1/accounts")
        .set("Authorization", header);
      // 2. Expect results
      expect(res.status).toBe(404);
    });
    it("Test_GetAllAccounts It should return 200 for accounts found", async () => {
      // 1. Generate and create random users
      // a. generate users
      const genUsers = UnitTest.GenRandValidUsers(
        RandomVal.GenRandomInteger(MIN)
      );
      // b. create users
      const users = await User.bulkCreate(genUsers);
      // c. get users IDs
      let userIds = [];
      users.forEach((el) => {
        userIds.push(el.id);
      });

      // 2. Generate and create random zones
      // a. generate zones
      const genZones = UnitTest.GenRandomValidZones(
        RandomVal.GenRandomInteger(MIN),
        userIds
      );
      // b. create zones
      const zones = await Zone.bulkCreate(genZones);
      // c. get zones IDs
      let zoneIds = [];
      zones.forEach((el) => {
        zoneIds.push(el.id);
      });

      // 3. Generate and create random customers
      // a. generate customers
      const genCustomers = UnitTest.GenRandomValidCustomers(
        RandomVal.GenRandomInteger(MIN),
        zoneIds
      );
      // b. create customers
      const customers = await Customer.bulkCreate(genCustomers);
      // c. get customer IDs
      let customerIds = [];
      customers.forEach((el) => {
        customerIds.push(el.id);
      });

      // 4. Generate and create random customers accounts
      // a. generate
      let genAccounts = [];
      for (var i = 0; i < genCustomers.length; i++) {
        genAccounts.push(
          UnitTest.GenRandomValidCustomerAccount(customers[i].id)
        );
      }
      // b. create accounts
      const accounts = await Account.bulkCreate(genAccounts);

      // 5. Send request
      const res = await request(server)
        .get("/api/v1/accounts")
        .set("Authorization", header);

      // 6. Expect results
      expect(res.status).toBe(200);
      const { data } = JSON.parse(res.text);
      expect(data.docs.count).toBe(accounts.length);
    });
  });
  describe("GET /api/v1/accounts/:id", () => {
    it("Test_GetAccount It should return 404 for account not found", async () => {
      // 1. Generate random number as id
      const id = RandomVal.GenRandomInteger(MAX);

      // 2. Send request
      const res = await request(server)
        .get(`/api/v1/accounts/${id}`)
        .set("Authorization", header);

      // 3. Expect result
      expect(res.status).toBe(404);
    });
    it("Test_GetAccount It should return 200 if account is found", async () => {
      // 1. Generate random user
      // a. generate user
      const genUser = UnitTest.GenRandomValidUser();
      // b. create user
      const user = await User.create(genUser);

      // 2. Generate and create random zone
      // a. generate zone
      const genZone = UnitTest.GenRandomValidZone(user.id);
      // b. create zone
      const zone = await Zone.create(genZone);

      // 3. Generate and create random customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customer
      const customer = await Customer.create(genCustomer);

      // 4. Generate and create random customer account
      // a. generate account
      const genAccount = UnitTest.GenRandomValidCustomerAccount(customer.id);
      // b. create account
      const account = await Account.create(genAccount);

      // 5. Send request
      const res = await request(server)
        .get(`/api/v1/accounts/${account.id}`)
        .set("Authorization", header);

      // 6. Expect result
      expect(res.status).toBe(200);
      const { data } = JSON.parse(res.text);
      expect(data.data.hasOwnProperty("createdAt")).toBe(true);
      expect(data.data.name).toBe(genAccount.name);
      expect(data.data.type).toBe("customer");
      expect(data.data.balance).toBe(genAccount.balance);
    });
  });
  describe("PATCH /api/v1/accounts/:id", () => {
    it("Test_UpdateAccount It should return 404 for account not found", async () => {
      // 1. Generate random number as id
      const id = RandomVal.GenRandomInteger(MAX);

      // 2. send request
      const res = await request(server)
        .patch(`/api/v1/accounts/${id}`)
        .set("Authorization", header);

      // 3.expect results
      expect(res.status).toBe(404);
    });
    it("Test_UpdateAccount It should return 201 if account is updated", async () => {
      // 1. Generate random user
      // a. generate user
      const genUser = UnitTest.GenRandomValidUser();
      // b. create user
      const user = await User.create(genUser);

      // 2. Generate and create random zone
      // a. generate zone
      const genZone = UnitTest.GenRandomValidZone(user.id);
      // b. create zone
      const zone = await Zone.create(genZone);

      // 3. Generate and create random customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customer
      const customer = await Customer.create(genCustomer);

      // 4. Generate and create random customer account
      // a. generate account
      const genAccount = UnitTest.GenRandomValidCustomerAccount(customer.id);
      // b. create account
      const account = await Account.create(genAccount);
      // c. generate account update values
      const name = RandomVal.GenRandomValidString(MAX);

      // 5. Send request
      const res = await request(server)
        .patch(`/api/v1/accounts/${account.id}`)
        .send({ name })
        .set("Authorization", header);

      // 6. Find account
      const updatedAccount = await Account.findByPk(account.id);
      expect(updatedAccount.name).toBe(name);
    });
  });
  describe("DELETE /api/v1/accounts/:id", () => {
    it("Test_DeleteAccount It should return 404 for account not found", async () => {
      // 1. Generate random number as id
      const id = RandomVal.GenRandomInteger(MAX);

      // 2. send request
      const res = await request(server)
        .delete(`/api/v1/accounts/${id}`)
        .set("Authorization", header);

      // 3.expect results
      expect(res.status).toBe(404);
    });
    it("Test_DeleteAccount It should return 400 if the account is the source account", async () => {
      // 1. Generate random user
      // a. generate user
      const genUser = UnitTest.GenRandomValidUser();
      // b. create user
      const user = await User.create(genUser);

      // 2. Generate and create random zone
      // a. generate zone
      const genZone = UnitTest.GenRandomValidZone(user.id);
      // b. create zone
      const zone = await Zone.create(genZone);

      // 3. Generate and create random customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customer
      const customer = await Customer.create(genCustomer);

      // 4. Generate and create random customer account
      // a. generate account and set type to source
      const genAccount = UnitTest.GenRandomValidCustomerAccount(customer.id);
      genAccount.type = "source";
      // b. create account
      const account = await Account.create(genAccount);

      // 5. send request
      const res = await request(server)
        .delete(`/api/v1/accounts/${account.id}`)
        .set("Authorization", header);

      // 6. Expect results
      expect(res.status).toBe(400);
    });
    it("Test_DeleteAccount It should set account to inactive", async () => {
      // 1. Generate random user
      // a. generate user
      const genUser = UnitTest.GenRandomValidUser();
      // b. create user
      const user = await User.create(genUser);

      // 2. Generate and create random zone
      // a. generate zone
      const genZone = UnitTest.GenRandomValidZone(user.id);
      // b. create zone
      const zone = await Zone.create(genZone);

      // 3. Generate and create random customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customer
      const customer = await Customer.create(genCustomer);

      // 4. Generate and create random customer account
      // a. generate account
      const genAccount = UnitTest.GenRandomValidCustomerAccount(customer.id);
      // b. create account
      const account = await Account.create(genAccount);

      // 5. send request
      const res = await request(server)
        .delete(`/api/v1/accounts/${account.id}`)
        .set("Authorization", header);

      // 6. Expect results
      expect(res.status).toBe(201);
      const returnedAccount = await Account.findByPk(account.id);
      expect(returnedAccount.active).toBe(false);
      //TODO: complete this check 👇
      //expect(returnedAccount.dateClosed).toBe(Date.now());
    });
  });
  it("GET /api/v1/accounts/sumAllCustomersBalance", async () => {
    // 1. Generate and create random users
    // a. generate users
    const genUsers = UnitTest.GenRandValidUsers(
      RandomVal.GenRandomInteger(MIN)
    );
    // b. create users
    const users = await User.bulkCreate(genUsers);
    // c. get users IDs
    let userIds = [];
    users.forEach((el) => {
      userIds.push(el.id);
    });

    // 2. Generate and create random zones
    // a. generate zones
    const genZones = UnitTest.GenRandomValidZones(
      RandomVal.GenRandomInteger(MIN),
      userIds
    );
    // b. create zones
    const zones = await Zone.bulkCreate(genZones);
    // c. get zones IDs
    let zoneIds = [];
    zones.forEach((el) => {
      zoneIds.push(el.id);
    });

    // 3. Generate and create random customers
    // a. generate customers
    const genCustomers = UnitTest.GenRandomValidCustomers(
      RandomVal.GenRandomInteger(MIN),
      zoneIds
    );
    // b. create customers
    const customers = await Customer.bulkCreate(genCustomers);
    // c. get customer IDs
    let customerIds = [];
    customers.forEach((el) => {
      customerIds.push(el.id);
    });

    // 4. Generate and create random customers accounts
    // a. generate
    let genAccounts = [];
    for (var i = 0; i < genCustomers.length; i++) {
      genAccounts.push(UnitTest.GenRandomValidCustomerAccount(customers[i].id));
    }
    // b. create accounts
    const accounts = await Account.bulkCreate(genAccounts);

    // 5. Send request
    const res = await request(server)
      .get("/api/v1/accounts/sumAllCustomersBalance")
      .set("Authorization", header);

    // 6. Expect results
    expect(res.status).toBe(200);
    const { data } = JSON.parse(res.text);
    expect(data.totalAmount).notNull;
  });
});
