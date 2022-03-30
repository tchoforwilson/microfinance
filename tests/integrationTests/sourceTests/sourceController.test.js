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
const Account = database.account;
const Source = database.source;
const Op = database.Sequelize.Op;

describe("SourceController_Tests", () => {
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
    await Account.sequelize.authenticate();
    await Source.sequelize.authenticate();
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
  afterEach(async () => {
    // Update source account by setting balance back to zero
    const updateBalance = { balance: null };
    await Account.update(updateBalance, { where: { id: sourceAccount.id } });
    await Source.destroy({ where: {}, truncate: false });
    await Zone.destroy({
      where: {},
      truncate: false,
    });
    await User.destroy({
      where: { [Op.not]: [{ id: adminUser.id }] },
      truncate: false,
    });
  });
  describe("POST /api/v1/sources", () => {
    it("Test_CreateSource It should return 200 for source created", async () => {
      // 1. Generate and create random valid zone
      // a. generate zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);

      // 2. Generate random valid source
      const source = UnitTest.GenRandomValidSource(zone.id);

      // 3. Send request
      const res = await request(server)
        .post("/api/v1/sources")
        .set("Authorization", header)
        .send(source);

      // 4. Expect result
      expect(res.status).toBe(200);
      const { data } = JSON.parse(res.text);
      //   expect(data).toHaveProperty("source").toBeTruthy();
      //   expect(data).toHaveProperty("sourceAccount").toBeTruthy();
      expect(data.sourceAccount.balance).toEqual(source.amount);
    });
  });
  describe("GET /api/v1/sources/:id", () => {
    it("Test_GetSource It should return 404 for source not found", async () => {
      // 1. Generate random number as source id
      const id = RandomVal.GenRandomInteger(MAX);

      // 2. Send request
      const res = await request(server)
        .get(`/api/v1/sources/${id}`)
        .set("Authorization", header);

      // 3. Expect result
      expect(res.status).toBe(404);
    });
    it("Test_GetSource It should return 200 for source found", async () => {
      // 1. Generate and create random valid zone
      // a. generate zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);

      // 2. Generate and create random source
      // a. generate source
      const genSource = UnitTest.GenRandomValidSource(zone.id);
      // b. create source
      const source = await Source.create(genSource);

      // 3. Send request
      const res = await request(server)
        .get(`/api/v1/sources/${source.id}`)
        .set("Authorization", header);

      // 4. Expect result
      expect(res.status).toBe(200);
      const { data } = JSON.parse(res.text);
      expect(data.data.amount).toEqual(source.amount);
      expect(data.data.zone).toBe(zone.id);
    });
  });
  describe("GET /api/v1/sources", () => {
    it("Test_GetAllSources It should return 404 for sources not found", async () => {
      // 1. Send request
      const res = await request(server)
        .get("/api/v1/sources")
        .set("Authorization", header);

      // 2. Expect result
      expect(res.status).toBe(404);
    });
    // TODO: revisit test
    it("Test_GetAllSources It Should return 200 for all sources found", async () => {
      // 1. Generate and create random users
      // a. generate random users
      const genUsers = UnitTest.GenRandValidUsers(MIN);
      // b. create users
      const users = await User.bulkCreate(genUsers);
      // c. get users ids
      let userIds = [];
      users.forEach((el) => {
        userIds.push(el.id);
      });
      // 2. Generate and create random valid zones
      // a. generate zones
      const genZones = UnitTest.GenRandomValidZones(MIN, userIds);
      // b. create zones
      const zones = await Zone.bulkCreate(genZones);
      // c. get zones IDs
      let zoneIds = [];
      zones.forEach((el) => {
        zoneIds.push(el.id);
      });

      // 3. Generate and create random sources
      // a. generate sources
      const genSources = UnitTest.GenRandomValidSources(MIN, zoneIds);
      // b. create sources
      await Source.bulkCreate(genSources);

      // 4. Send request
      const res = await request(server)
        .get("/api/v1/sources")
        .set("Authorization", header);

      // 5. Expect result
      expect(res.status).toBe(200);
      const { data } = JSON.parse(res.text);
      expect(data.docs.count).toEqual(MIN);
    });
  });
  describe("DELETE /api/v1/sources/:id", () => {
    it("Test_DeleteSource It should return 404 for source not found", async () => {
      // 1. Generate random number as id
      const id = RandomVal.GenRandomInteger(MAX);

      // 2. Send request
      const res = await request(server)
        .delete(`/api/v1/sources/${id}`)
        .set("Authorization", header);

      // 3. Expect result
      expect(res.status).toBe(404);
    });
    it("Test_DeleteSource It should return 404 if the source account is not found", async () => {
      // 1. Generate and create random valid zone
      // a. generate zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);

      // 2. Generate and create random valid source
      // a. generate source
      const genSource = UnitTest.GenRandomValidSource(zone.id);
      // c.create source
      const source = await Source.create(genSource);
      // d. delete source account from account table
      await Account.destroy({ where: { id: sourceAccount.id } });

      // 3. Send request
      const res = await request(server)
        .delete(`/api/v1/sources/${source.id}`)
        .set("Authorization", header);

      // 4. Expect result
      expect(res.status).toBe(404);
    });
    it("Test_DeleteSource It should return 201 for source deleted", async () => {
      // 1. Generate and create random valid zone
      // a. generate zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);

      // 2. Generate and create random valid source
      // a. generate source
      const genSource = UnitTest.GenRandomValidSource(zone.id);
      // c.create source
      const source = await Source.create(genSource);
      // d. Add amount to source
      sourceAccount.balance = source.amount;
      await sourceAccount.save();

      // 3. Send request
      const res = await request(server)
        .delete(`/api/v1/sources/${source.id}`)
        .set("Authorization", header);

      // 4. Expect result
      expect(res.status).toBe(201);
      const { data } = JSON.parse(res.text);
      //   expect(data).toHaveProperty("source").toBeTruthy();
      //   expect(data).toHaveProperty("sourceAccount").toBeTruthy();
      expect(data.balance).toEqual(0);

      // 5. Find source and check that it doesn't exist
      const returnedSource = Source.findByPk(source.id);
      //expect(returnedSource).toBeNull;
    });
  });
  describe("GET /api/v1/sources/daily-source", () => {
    it("Test_GetAllSumSourceToday It should return null for no sum found", async () => {
      // 1. Send request
      const res = await request(server)
        .get("/api/v1/sources/daily-source")
        .set("Authorization", header);

      // 2. Expect result
      expect(res.status).toBe(200);
      const { data } = JSON.parse(res.text);
      expect(data.count).toEqual(0);
      expect(data.count).toEqual(0);
    });
    it("Test_GetAllSumSourceToday It should return sum amount of all sources for current date", async () => {
      // 1. Generate and create random users
      // a. generate random users
      const genUsers = UnitTest.GenRandValidUsers(MIN);
      // b. create users
      const users = await User.bulkCreate(genUsers);
      // c. get users ids
      let userIds = [];
      users.forEach((el) => {
        userIds.push(el.id);
      });
      // 2. Generate and create random valid zones
      // a. generate zones
      const genZones = UnitTest.GenRandomValidZones(MIN, userIds);
      // b. create zones
      const zones = await Zone.bulkCreate(genZones);
      // c. get zones IDs
      let zoneIds = [];
      zones.forEach((el) => {
        zoneIds.push(el.id);
      });

      // 3. Generate and create random sources
      // a. generate sources
      const genSources = UnitTest.GenRandomValidSources(MIN, zoneIds);
      // b. create sources
      await Source.bulkCreate(genSources);

      // 4. Send request
      const res = await request(server)
        .get("/api/v1/sources/daily-source")
        .set("Authorization", header);

      // 5. Expect result
      expect(res.status).toBe(200);
      const { data } = JSON.parse(res.text);
      expect(data.count).toEqual(MIN);
    });
  });
  describe("GET /api/v1/sources/monthly-source", () => {
    it("Test_GetTotalSourceSumMonth It should return 200 for all sum of the month", async () => {
      // 1. Generate and create random users
      // a. generate random users
      const genUsers = UnitTest.GenRandValidUsers(MIN);
      // b. create users
      const users = await User.bulkCreate(genUsers);
      // c. get users ids
      let userIds = [];
      users.forEach((el) => {
        userIds.push(el.id);
      });
      // 2. Generate and create random valid zones
      // a. generate zones
      const genZones = UnitTest.GenRandomValidZones(MIN, userIds);
      // b. create zones
      const zones = await Zone.bulkCreate(genZones);
      // c. get zones IDs
      let zoneIds = [];
      zones.forEach((el) => {
        zoneIds.push(el.id);
      });

      // 3. Generate and create random sources
      // a. generate sources
      const genSources = UnitTest.GenRandomValidSources(MIN, zoneIds);
      // b. create sources
      await Source.bulkCreate(genSources);
      // c. get sum
      let sum = 0;
      genSources.forEach((el) => {
        sum += el.amount;
      });

      // 4. Send request
      const res = await request(server)
        .get("/api/v1/sources/monthly-source/")
        .set("Authorization", header);

      // 5. Expect result
      expect(res.status).toBe(200);
      const { data } = JSON.parse(res.text);
      expect(data.sum).toEqual(sum);
    });
    it("Test_GetTotalSourceSumMonth It should return 200 for and sum of all amount should be null", async () => {
      // 1. Send request
      const res = await request(server)
        .get("/api/v1/sources/monthly-source/")
        .set("Authorization", header);

      // 2. Expect result
      expect(res.status).toBe(200);
      const { data } = JSON.parse(res.text);
      expect(data.sum).toEqual(null);
    });
  });
});
