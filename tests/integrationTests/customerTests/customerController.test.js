"use strict";
import request from "supertest";
import * as RandomVal from "./../../testUtilities/GenRandomVal.js";
import * as UnitTest from "./../../testUtilities/unit_testbases.js";
import { createAdminUser, getHeader } from "./../../testUtilities/testUtils.js";
import database from "./../../../config/database.js";

const User = database.user;
const Zone = database.zone;
const Customer = database.customer;
const Op = database.Sequelize.Op;

describe("CustomerController_Tests", () => {
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
    adminUser = await createAdminUser("manager");
    header = getHeader(adminUser);
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
    await Customer.destroy({ where: {}, truncate: false });
    await Zone.destroy({ where: {}, truncate: false });
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
    await Customer.destroy({ where: {}, truncate: false });
    await Zone.destroy({
      where: {},
      truncate: false,
    });
  });
  describe("POST /api/v1/customers", () => {
    it.only("Test_CreateCustomer It should return 200 for successful creation", async () => {
      // 1. Generate random valid zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);

      // 2. Save zone in the database
      const zone = await Zone.create(genZone);

      // 3. Generate random valid customer
      const customer = UnitTest.GenRandomValidCustomer(zone.id);

      // 4. Send request
      const res = await request(server)
        .post("/api/v1/customers")
        .set("Authorization", header)
        .send(customer);

      // 3. Expect result
      const data = JSON.parse(res.text);
      const returnCustomer = data.data.doc;
      expect(res.status).toBe(201);

      expect(returnCustomer).toHaveProperty("id");
      expect(returnCustomer.zone).toBe(zone.id);
    });
  });
});
