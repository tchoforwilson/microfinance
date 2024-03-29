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
    await Account.sequelize.authenticate();
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
    it("Test_CreateCustomer It should return 200 for successful creation", async () => {
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
  describe("GET /api/v1/customers", () => {
    it("Test_GetAllCustomers It should return 404 for no customers found", async () => {
      // 1. Send request
      const res = await request(server)
        .get("/api/v1/customers")
        .set("Authorization", header);

      // 2. Expect result
      expect(res.status).toBe(404);
    });
    it("Test_GetAllCustomers It should return 200 for all customers found", async () => {
      // 1. Generate and create valid zone
      // a. Generate zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);
      let zones = [];
      zones.push[zone.id];

      // 2. Generate and create random valid customers
      // a. generate customer
      const genCustomers = UnitTest.GenRandomValidCustomers(MIN, zones);
      // b. create customers
      await Customer.bulkCreate(genCustomers);

      // 3. Send request
      const res = await request(server)
        .get("/api/v1/customers")
        .set("Authorization", header);

      // 4. Expect result
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.data.docs.count).toEqual(genCustomers.length);
    });
  });
  describe("PATCH /api/v1/customers/:id", () => {
    it("Test_UpdateCustomer It should return 404 for customer not found", async () => {
      // 1. Generate random numbers as customer id
      const id = RandomVal.GenRandomInteger(MAX);

      // 2. Send request
      const res = await request(server)
        .get(`/api/v1/customers/${id}`)
        .set("Authorization", header);

      // 3. expect result
      expect(res.status).toBe(404);
    });
    it("Test_UpdateCustomer It should return 201 for a successful customer update", async () => {
      // 1. Generate and create random valid zone
      // a. generate zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);

      // 2. Generate and create random valid customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customer
      const customer = await Customer.create(genCustomer);

      // 3. Generate customer for update
      const updateCustomer = UnitTest.GenRandomValidCustomer(zone.id);

      // 4. Send request
      const res = await request(server)
        .patch(`/api/v1/customers/${customer.id}`)
        .set("Authorization", header)
        .send(updateCustomer);

      // 4. expect result
      expect(res.status).toBe(201);
      const returnedCustomer = await Customer.findByPk(customer.id);
      expect(updateCustomer.email).toEqual(returnedCustomer.email);
      expect(updateCustomer.identity).toEqual(returnedCustomer.identity);
      expect(updateCustomer.contact).toEqual(returnedCustomer.contact);
    });
  });
  describe("GET /api/v1/customers/:id", () => {
    it("Test_GetCustomer It should return 404 for customer not found", async () => {
      // 1. Generate random number as id,
      const id = RandomVal.GenRandomInteger(MAX);

      // 2. Send request
      const res = await request(server)
        .get(`/api/v1/customers/${id}`)
        .set("Authorization", header);

      // 3. Expect results
      expect(res.status).toBe(404);
    });
    it("Test_GetCustomer It should return 200 if customer is found", async () => {
      // 1. Generate and create random valid zone
      // a. generate zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);

      // 2. Generate and create random valid customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customer
      const customer = await Customer.create(genCustomer);

      // 3. Send request
      const res = await request(server)
        .get(`/api/v1/customers/${customer.id}`)
        .set("Authorization", header);

      // 4. expect result
      expect(res.status).toBe(200);
      const { data } = JSON.parse(res.text);
      expect(data.data.identity).toEqual(customer.identity);
      expect(data.data.contact).toEqual(customer.contact);
      expect(data.data.email).toEqual(customer.email);
    });
  });
  describe("DELETE /api/v1/customers/:id", () => {
    it("Test_DeleteCustomer It should return 404 for customer not found", async () => {
      // 1. Generate random number as id,
      const id = RandomVal.GenRandomInteger(MAX);

      // 2. Send request
      const res = await request(server)
        .delete(`/api/v1/customers/${id}`)
        .set("Authorization", header);

      // 3. Expect results
      expect(res.status).toBe(404);
    });
    it("Test_DeleteCustomer It should return 204 if the customer is set to inactive", async () => {
      // 1. Generate and create random valid zone
      // a. generate zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);

      // 2. Generate and create random valid customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customer
      const customer = await Customer.create(genCustomer);

      // 3. Send request
      const res = await request(server)
        .delete(`/api/v1/customers/${customer.id}`)
        .set("Authorization", header);

      // 4. expect result
      expect(res.status).toBe(204);
      const returnedCustomer = await Customer.findByPk(customer.id);
      expect(returnedCustomer.active).toBe(false);
    });
  });
  describe("POST /api/v1/customers/addAccount", () => {
    it("Test_AddCustomerAccount It should return 404 if the customer is not found", async () => {
      // 1. Generate random number as customer id
      const id = RandomVal.GenRandomInteger(MAX);

      // 2. Generate random valid account name
      const name = RandomVal.GenRandomValidString(MAX);

      // 3. Send request
      const customer = {};
      customer.name = name;
      customer.customer = id;
      const res = await request(server)
        .post("/api/v1/customers/addAccount")
        .set("Authorization", header)
        .send(customer);

      // 4. Expect results
      expect(res.status).toBe(404);
    });
    it("Test_AddCustomerAccount It should return 200 if the customer account is created", async () => {
      // 1. Generate and create random valid zone
      // a. generate zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);

      // 2. Generate and create random valid customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customer
      const customer = await Customer.create(genCustomer);

      // 3. Generate random valid account name
      const name = RandomVal.GenRandomValidString(MAX);

      // 4. Send request with account name and customer's ID
      const res = await request(server)
        .post("/api/v1/customers/addAccount")
        .set("Authorization", header)
        .send({ name, customer: customer.id });

      // 5. Expect results
      expect(res.status).toBe(200);
      const { data } = JSON.parse(res.text);
      expect(data.account.name).toEqual(name);
      expect(data.account.customer).toEqual(customer.id);
      expect(data.account.type).toBe("customer");

      await Account.destroy({ where: {}, truncate: false });
    });
  });
  it("GET /api/v1/customers/:customerId/accounts", async () => {
    // 1. Generate and create random valid zone
    // a. generate zone
    const genZone = UnitTest.GenRandomValidZone(adminUser.id);
    // b. create zone
    const zone = await Zone.create(genZone);

    // 2. Generate and create random valid customer
    // a. generate customer
    const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
    // b. create customer
    const customer = await Customer.create(genCustomer);

    // 3. Generate random valid customer accounts name
    const accounts = [];
    for (var i = 0; i < MIN; i++) {
      accounts.push(UnitTest.GenRandomValidCustomerAccount(customer.id));
    }
    // 4. Create customer accounts
    await Account.bulkCreate(accounts);

    // 5. Send request to get all customers accounts
    const res = await request(server)
      .get(`/api/v1/customers/${customer.id}/accounts`)
      .set("Authorization", header);

    // 6. Expect results
    expect(res.status).toBe(200);
    const { data } = JSON.parse(res.text);
    expect(data.docs.count).toEqual(MIN);

    // 7. Destroy account data
    await Account.destroy({ where: {}, truncate: false });
  });
});
