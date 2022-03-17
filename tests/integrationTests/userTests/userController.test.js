"use strict";
import request from "supertest";
import bcrypt from "bcrypt";
import * as RandomVal from "./../../testUtilities/GenRandomVal.js";
import * as UnitTest from "./../../testUtilities/unit_testbases.js";
import { signToken } from "./../../testUtilities/testUtils.js";
import database from "./../../../config/database.js";

const User = database.user;
const Account = database.account;

describe("UserController_Tests", () => {
  const MAX = 32;
  // define variables globally needed
  let server;
  let adminUser = {};
  let token;
  const createAdmin = async () => {
    const user = UnitTest.GenRandomValidUserWithPassword();
    user.password = "pass1234";
    user.role = "manager";
    user.passwordConfirm = "pass1234";
    const adminUser = await User.create(user);
    token = signToken(adminUser.user_id);
  };
  // 1. Call the server
  beforeEach(async () => {
    const mod = await import("../../../index");
    server = mod.default;
    await createAdmin();
  });

  afterEach(async () => {
    if (server) {
      server.close();
      await User.destroy({ where: {}, truncate: false });
      await Account.destroy({ where: {}, truncate: false });
    }
  });
  describe("/api/v1/users", () => {
    it("Test_CreateUser It Should return 400 for Invalid role", () => {
      const user = UnitTest.GenRandomValidUser();
      user.role = "manager";
      const header = "Bearer " + token;
      const res = request(server)
        .post("/api/v1/users/")
        .send(user)
        .set("authorization", token);

      expect(res.status).toBe(400);
    });
  });
});
