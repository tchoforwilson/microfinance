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
      where: { [Op.not]: [{ user_id: adminUser.user_id }] },
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
  });
});
