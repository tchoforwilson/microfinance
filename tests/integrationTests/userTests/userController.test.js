"use strict";
import request from "supertest";
import * as RandomVal from "./../../testUtilities/GenRandomVal.js";
import * as UnitTest from "./../../testUtilities/unit_testbases.js";
import { signToken } from "./../../testUtilities/testUtils.js";
import database from "./../../../config/database.js";

const User = database.user;
const Account = database.account;
const Op = database.Sequelize.Op;

describe("UserController_Tests", () => {
  const MAX = 12;
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
      "createUser",
      "getUsers",
      "getUser",
      "updateUser",
      "deleteUser"
    );
    adminUser = await User.create(user);
    const token = signToken(adminUser.id);
    header = "Bearer " + token;
  };
  // 1. Call the server
  beforeAll(async () => {
    const mod = await import("../../../index");
    server = mod.default;
    await User.sequelize.sync();
    await createAdmin();
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
    await User.destroy({ where: {}, truncate: false });
  });
  afterEach(async () => {
    // await User.destroy({
    //   where: { [Op.not]: [{ user: adminUser.id }] },
    //   truncate: false,
    // });
  });
  describe("POST /api/v1/users", () => {
    it("Test_CreateUser It Should return 400 for Invalid role", async () => {
      const user = UnitTest.GenRandomValidUser();
      user.role = "manager";
      const res = await request(server)
        .post("/api/v1/users/")
        .send(user)
        .set("Authorization", header);

      expect(res.status).toBe(400);
    });
    it("Test_CreateUser It Should return 201 if the user was successfully created", async () => {
      const user = UnitTest.GenRandomValidUser();
      const res = await request(server)
        .post("/api/v1/users/")
        .send(user)
        .set("Authorization", header);
      const data = JSON.parse(res.text);
      expect(res.status).toBe(201);
      expect(data.status).toBe("success");
      expect(data.data.data).not.toBe.null;
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
      const users = UnitTest.GenRandValidUsers(RandomVal.GenRandomInteger(MAX));

      await User.bulkCreate(users);

      // 2. Populate database with user
      const res = await request(server)
        .get("/api/v1/users/")
        .set("Authorization", header);
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);

      expect(data.data.docs.count).toBe(users.length + 1);
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
    it("Test_GetUser It should return 200 if the user is found", async () => {
      // 1. Generate random user
      const user = UnitTest.GenRandomValidUserWithPassword();

      // 2. Populate DB with user
      const newUser = await User.create(user);

      // 3. Get response
      const res = await request(server)
        .get(`/api/v1/users/${newUser.id}`)
        .set("Authorization", header);

      // 4. Check response
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      const returnUser = data.data.data;
      expect(data.status).toBe("success");
      expect(returnUser.firstname).toBe(newUser.firstname);
      expect(returnUser.email).toBe(newUser.email);
      expect(returnUser.contact).toBe(newUser.contact);
      expect(returnUser.role).toBe(newUser.role);
    });
  });
  describe("PATCH /api/v1/users/:id", () => {
    it("Test_UpdateUser It should return 404 for user not found", async () => {
      // 1. Generate random id number
      const id = RandomVal.GenRandomInteger(MAX);

      // 2. Generate random user
      const user = await UnitTest.GenRandomValidUser();

      // 3. Send request
      const res = await request(server)
        .patch(`/api/v1/users/${id}`)
        .send(user)
        .set("Authorization", header);

      // 4. Expect response
      expect(res.status).toBe(404);
    });
    it("Test_UpdateUser It should return 201 for documents update", async () => {
      // 1. Generate random user
      const user = UnitTest.GenRandomValidUser();

      // 2. Populate database with user
      const newUser = await User.create(user);

      // 3. Generate updatedUser data
      const updatedUser = UnitTest.GenRandomValidUser();

      // 4. Send request
      const res = await request(server)
        .patch(`/api/v1/users/${newUser.id}`)
        .send(updatedUser)
        .set("Authorization", header);

      // 5. expect response
      expect(res.status).toBe(201);

      // 6. Fetch user and compare with updated value
      const returnUser = await User.findByPk(newUser.id);
      Object.keys(updatedUser).forEach((el) => {
        expect(updatedUser).toHaveProperty(el, returnUser[el]);
      });
    });
  });
  describe("DELETE /api/v1/users/:id", () => {
    it("Test_DeleteUser It should return 404 for user not found", async () => {
      // 1. Generate random numbers as id
      const id = RandomVal.GenRandomInteger(MAX);

      // 2. Send request
      const res = await request(server)
        .delete(`/api/v1/users/${id}`)
        .set("Authorization", header);

      // 3. Expect results
      expect(res.status).toBe(404);
    });
    it("Test_DeleteUser It should return 204 for successful user delete", async () => {
      // 1. Generate random user
      const user = UnitTest.GenRandomValidUser();

      // 2. Populate database with user
      const newUser = await User.create(user);

      // 3. Send request
      const res = await request(server)
        .delete(`/api/v1/users/${newUser.id}`)
        .set("Authorization", header);

      // 4. expect response
      expect(res.status).toBe(204);

      // 6. Fetch user and compare with updated value
      const returnUser = await User.findByPk(newUser.id);
      expect(returnUser.active).toBe(false);
    });
  });

  /**
   * TEST OUT OF USER CRUD OPERATIONS
   */
  it("POST /api/v1/users/addAccount It should return 404 if the user is not found", async () => {
    // 1. Generate random numbers as id and string as name
    const id = RandomVal.GenRandomInteger(MAX);
    const name = RandomVal.GenRandomValidString(MAX);

    // 2. Send request
    const res = await request(server)
      .post("/api/v1/users/addAccount")
      .send({ name, user: id })
      .set("Authorization", header);

    // 3. Expect results
    expect(res.status).toBe(404);
  });
  it("POST /api/v1/users/addAccount It should return 400 if the user role is manager or accountant", async () => {
    let id;
    // 1. Get admin user id or generate an accountant and use id
    if (RandomVal.GenRandomBoolean()) {
      id = adminUser.id;
    } else {
      const genUser = UnitTest.GenRandomValidUser();
      genUser.role = "accountant";
      const user = await User.create(genUser);
      id = user.id;
    }

    // 2. Generate random account name
    const name = RandomVal.GenRandomValidString(MAX);

    // 2. Send request
    const res = await request(server)
      .post("/api/v1/users/addAccount")
      .send({ name, user: id })
      .set("Authorization", header);

    // 3. Expect results
    expect(res.status).toBe(400);
  });
  it("POST /api/v1/users/addAccount It should return 200 if the user account is successfully created", async () => {
    // 1. Get admin user id or generate an accountant and use id
    const genUser = UnitTest.GenRandomValidUser();
    genUser.role = "collector";
    const user = await User.create(genUser);

    // 2. Generate random account name
    const name = RandomVal.GenRandomValidString(MAX);

    // 2. Send request
    const res = await request(server)
      .post("/api/v1/users/addAccount")
      .send({ name, user: user.id })
      .set("Authorization", header);

    // 3. Expect results
    expect(res.status).toBe(200);
    const data = JSON.parse(res.text);
    expect(data.data.account.name).toEqual(name);

    // 4. Destroy account
    await Account.destroy({ where: { user: user.id } });
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
