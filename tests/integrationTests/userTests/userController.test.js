"use strict";
import request from "supertest";
import * as RandomVal from "./../../testUtilities/GenRandomVal.js";
import * as UnitTest from "./../../testUtilities/unit_testbases.js";
import { signToken } from "./../../testUtilities/testUtils.js";
import database from "./../../../config/database.js";
import { before } from "lodash";

const User = database.user;
const Account = database.account;
const Op = database.Sequelize.Op;

describe("UserController_Tests", () => {
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
    user.rights.push("createUser", "getUsers", "getUser");
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
  });
  describe("POST /api/v1/users", () => {
    it("Test_CreateUser It Should return 400 for Invalid role", async () => {
      //await createAdmin();
      const user = UnitTest.GenRandomValidUser();
      user.role = "manager";
      const res = await request(server)
        .post("/api/v1/users/")
        .send(user)
        .set("Authorization", header);

      expect(res.status).toBe(400);
    });
    it("Test_CreateUser It Should return 201 if the user was successfully created", async () => {
      //await createAdmin();
      const user = UnitTest.GenRandomValidUser();
      const res = await request(server)
        .post("/api/v1/users/")
        .send(user)
        .set("Authorization", header);
      const data = JSON.parse(res.text);
      expect(res.status).toBe(201);
      expect(data.status).toBe("success");
      expect(data.data.data).not.toBe.null;
      expect(data.data.data.account).not.toBe.null;
      expect(data.data.data.account.balance).toBe(0);
    });
  });
  describe("GET /api/v1/users", () => {
    it("Test_GetAllUsers_1 It should return 200 for documents found", async () => {
      const res = await request(server)
        .get("/api/v1/users/")
        .set("Authorization", header);
      const data = JSON.parse(res.text);
      expect(res.status).toBe(200);
      expect(data.status).toBe("success");
      expect(data.data.docs.count).toBe(1);
      // TODO: check that it is a n array
      //expect(data.data.docs.rows).toBeArray();
    });
    it("Test_GetAllUsers_2 It should return 200 for documents found", async () => {
      // 1. Generate random valid users
      const users = UnitTest.GenRandValidUsers(MAX);

      await User.bulkCreate(users);

      // 2. Populate database with user
      const res = await request(server)
        .get("/api/v1/users/")
        .set("Authorization", header);
      expect(res.status).toBe(200);
    });
  });
  describe("GET /api/v1/users/:id", () => {
    it("Test_GetUser It should return 404 if the user is not found", async () => {
      const id = RandomVal.GenRandomInteger(MAX);

      const res = await request(server)
        .get(`/api/v1/users/${id}`)
        .set("Authorization", header);
      expect(res.status).toBe(404);
    });
  });
});

// describe("UserController_Tests", () => {
//   beforeAll(() => {
//     console.log("Initialize server");
//   });
//   afterAll(() => {
//     console.log("Close server");
//   });
//   beforeEach(() => {
//     console.log("Create database");
//   });
//   afterEach(() => {
//     console.log("Close database");
//   });
//   describe("/api/v1/users 1", () => {
//     it("1=> Test 1", () => {
//       console.log("1=> Inner Test 1");
//     });
//     it("1=> Test 2", () => {
//       console.log("1=> Inner Test 2");
//     });
//   });
//   describe("/api/v1/users 2", () => {
//     it("2=> Test 1", () => {
//       console.log("2=> Inner Test 1");
//     });
//     it("2=> Test 2", () => {
//       console.log("2=> Inner Test 2");
//     });
//   });
// });
