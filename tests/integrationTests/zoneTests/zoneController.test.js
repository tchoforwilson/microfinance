"use strict";
import request from "supertest";
import * as RandomVal from "./../../testUtilities/GenRandomVal.js";
import * as UnitTest from "./../../testUtilities/unit_testbases.js";
import { signToken } from "./../../testUtilities/testUtils.js";
import database from "./../../../config/database.js";

const User = database.user;
const Zone = database.zone;
const Op = database.Sequelize.Op;

describe("ZoneController_Tests", () => {
  const MAX = 32;
  const MIN = 12;
  // define variables globally needed
  let server;
  let adminUser = {};
  let header;
  const createAdmin = async () => {
    const user = UnitTest.GenRandomValidUserWithPassword();
    user.password = "pass1234";
    user.passwordConfirm = "pass1234";
    user.role = "manager";
    user.rights.push(
      "createZone",
      "getZones",
      "getZone",
      "updateZone",
      "deleteZone"
    );
    adminUser = await User.create(user);
    const token = signToken(adminUser.id);
    header = "Bearer " + token;
  };
  // 1. Call the server
  beforeAll(async () => {
    const mod = await import("../../../index");
    server = mod.default;
    await User.sequelize.authenticate();
    await Zone.sequelize.authenticate();
    await createAdmin();
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
    await Zone.destroy({
      where: {},
      truncate: false,
    });
  });
  describe("POST /api/v1/zones", () => {
    it("Test_CreateZone It should return 200 for successful creation", async () => {
      // 1. Generate random valid zone
      const zone = UnitTest.GenRandomValidZone(adminUser.id);

      // 2. Send request
      const res = await request(server)
        .post("/api/v1/zones")
        .set("Authorization", header)
        .send(zone);

      // 3. Expect result
      const data = JSON.parse(res.text);
      const returnZone = data.data.doc;
      expect(res.status).toBe(201);

      expect(returnZone.name).toBe(zone.name);
      expect(returnZone.description).toBe(zone.description);
    });
  });
  describe("GET /api/v1/zones", () => {
    it("Test_GetAllZones It should return 404 for zones not found", async () => {
      // 1. send request
      const res = await request(server)
        .get("/api/v1/zones")
        .set("Authorization", header);

      expect(res.status).toBe(404);
    });
    it("Test_GetAllZones It should return 200 if zones are found", async () => {
      // 1. Generate random valid users
      const genUsers = UnitTest.GenRandValidUsers(4);
      // 2. Populate database with users
      const users = await User.bulkCreate(genUsers);
      // 3. Get users ids
      let userIds = [];
      users.forEach((el) => {
        userIds.push(el.id);
      });
      // 4. Generate random valid zones
      const genZones = UnitTest.GenRandomValidZones(MIN, userIds);
      // 5. Populate database with zones
      await Zone.bulkCreate(genZones);

      // 6. send request
      const res = await request(server)
        .get("/api/v1/zones")
        .set("Authorization", header);

      // 7. Expect result
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      const returnZones = data.data.docs;
      expect(returnZones.count).toEqual(MIN);
      returnZones.rows.forEach((zone) => {
        Object.keys(zone).forEach((el) => {
          expect(zone).toHaveProperty(el, zone[el]);
        });
      });
    });
  });
  describe("GET /api/v1/zones/:id", () => {
    it("Test_GetZone It should return 404 for zone not found", async () => {
      // 1. Generate random valid id
      const id = RandomVal.GenRandomInteger(MAX);
      // 2. Send request
      const res = await request(server)
        .get(`/api/v1/zones/${id}`)
        .set("Authorization", header);
      // 3. Expect result
      expect(res.status).toBe(404);
    });
    it("Test_GetZone It should return 200 for zone found", async () => {
      // 1. Generate random zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // 2. Create zone in table
      const zone = await Zone.create(genZone);
      const zoneData = zone.dataValues;
      // 2. Send request
      const res = await request(server)
        .get(`/api/v1/zones/${zone.id}`)
        .set("Authorization", header);
      // 3. Expect result
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      const returnZone = data.data.data;
      expect(returnZone.id).toEqual(zoneData.id);
      expect(returnZone.id).toEqual(zoneData.id);
    });
  });
  describe("PATCH /api/v1/zones/:id", () => {
    it("Test_UpdateZone It return 404 for zone not found", async () => {
      // 1. Generate random valid id
      const id = RandomVal.GenRandomInteger(MAX);
      // 2. Send request
      const res = await request(server)
        .patch(`/api/v1/zone/${id}`)
        .set("Authorization", header);
      // 3. Expect result
      expect(res.status).toBe(404);
    });
    it("Test_UpdateZone It return 201 successful zone update", async () => {
      // 1. Generate random valid zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // 2. Populate table with user
      const zone = await Zone.create(genZone);
      // 3. Generate zone for update
      const updateZone = UnitTest.GenRandomValidZone(adminUser.id);

      // 4. Send request
      const res = await request(server)
        .patch(`/api/v1/zones/${zone.id}`)
        .set("Authorization", header)
        .send(updateZone);
      // 5. Expect result
      expect(res.status).toBe(201);
    });
  });
  describe("DELETE /api/v1/zone/:id", () => {
    it("Test_DeleteZone It should return 404 for zone not found", async () => {
      // 1. Generate random valid id
      const id = RandomVal.GenRandomInteger(MAX);
      // 2. Send request
      const res = await request(server)
        .delete(`/api/v1/zone/${id}`)
        .set("Authorization", header);
      // 3. Expect result
      expect(res.status).toBe(404);
    });
    it("Test_DeleteZone It return 204 successful zone delete", async () => {
      // 1. Generate random valid zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // 2. Populate table with zone
      const zone = await Zone.create(genZone);
      // 3. Send request
      const res = await request(server)
        .delete(`/api/v1/zones/${zone.id}`)
        .set("Authorization", header);
      // 5. Expect result
      expect(res.status).toBe(204);
      const returnedZone = await Zone.findByPk(zone.id);
      expect(returnedZone.active).toBe(false);
    });
  });
  describe("GET /zone/:zoneId/customers", () => {
    it.only("Test_GetAllCustomersInZone It should return 404 if no customers are found in the zone", async () => {
      // 1. Generate random valid zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // 2. Populate table with zone
      const zone = await Zone.create(genZone);
      // 3. Send request
      const res = await request(server)
        .delete(`/api/v1/zones/${zone.id}/customers`)
        .set("Authorization", header);
      // 5. Expect result
      expect(res.status).toBe(404);
    });
  });
});
