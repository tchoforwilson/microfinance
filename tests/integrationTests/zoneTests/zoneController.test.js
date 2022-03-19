"use strict";
import request from "supertest";
import * as RandomVal from "./../../testUtilities/GenRandomVal.js";
import * as UnitTest from "./../../testUtilities/unit_testbases.js";
import { signToken } from "./../../testUtilities/testUtils.js";
import database from "./../../../config/database.js";

const User = database.user;
const Account = database.account;
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
    user.password_confirm = "pass1234";
    user.role = "manager";
    user.rights.push(
      "createZone",
      "getZones",
      "getZone",
      "updateZone",
      "deleteZone"
    );
    adminUser = await User.create(user);
    const token = signToken(adminUser.user_id);
    header = "Bearer " + token;
  };
  // 1. Call the server
  beforeAll(async () => {
    const mod = await import("../../../index");
    server = mod.default;
    await User.sequelize.sync();
    await Account.sequelize.sync();
    await Zone.sequelize.sync();
    await createAdmin();
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });
  afterEach(async () => {
    await User.destroy({
      where: { [Op.not]: [{ user_id: adminUser.user_id }] },
      truncate: false,
    });
    await Account.destroy({
      where: { [Op.not]: [{ user_id: adminUser.user_id }] },
      truncate: false,
    });
    await Zone.destroy({
      where: {},
      truncate: false,
    });
  });
  describe("POST /api/v1/zone", () => {
    it("Test_CreateZone It should return 200 for successful creation", async () => {
      // 1. Generate random valid zone
      const zone = UnitTest.GenRandomValidZone(adminUser.user_id);

      // 2. Send request
      const res = await request(server)
        .post("/api/v1/zone")
        .set("Authorization", header)
        .send(zone);

      // 3. Expect result
      const data = JSON.parse(res.text);
      const returnZone = data.data;
      expect(res.status).toBe(201);

      expect(returnZone.name).toBe(zone.name);
      expect(returnZone.description).toBe(zone.description);
      expect(returnZone.user_id).toBe(zone.user_id);
    });
    describe("GET /api/v1/zone", () => {
      it("Test_GetAllZones It should return 404 for zones not found", async () => {
        // 1. send request
        const res = await request(server)
          .get("/api/v1/zone")
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
          userIds.push(el.user_id);
        });
        // 4. Generate random valid zones
        const genZones = UnitTest.GenRandomValidZones(MIN, userIds);
        // 5. Populate database with zones
        await Zone.bulkCreate(genZones);

        // 6. send request
        const res = await request(server)
          .get("/api/v1/zone")
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
    describe("GET /api/v1/zone/:id", () => {
      it("Test_GetZone It should return 404 for zone not found", async () => {
        // 1. Generate random valid id
        const id = RandomVal.GenRandomInteger(MAX);
        // 2. Send request
        const res = await request(server)
          .get(`/api/v1/zone/${id}`)
          .set("Authorization", header);
        // 3. Expect result
        expect(res.status).toBe(404);
      });
    });
  });
});
