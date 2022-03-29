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
  });
  afterEach(async () => {
    // await User.destroy({
    //   where: { [Op.not]: [{ id: adminUser.id }] },
    //   truncate: false,
    // });
    await Account.destroy({ where: {}, truncate: false });
    await Customer.destroy({ where: {}, truncate: false });
    await Zone.destroy({
      where: {},
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
  });
});
