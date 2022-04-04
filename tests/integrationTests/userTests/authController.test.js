"use strict";
import request from "supertest";
import bcrypt from "bcrypt";
import * as RandomVal from "./../../testUtilities/GenRandomVal.js";
import * as UnitTest from "./../../testUtilities/unit_testbases.js";
import {
  createAdminUser,
  getHeader,
  createSourceAccount,
} from "./../../testUtilities/testUtils.js";
import database from "./../../../config/database.js";

const User = database.user;
const Account = database.account;
describe("AuthController_Tests", () => {
  const MAX = 32;
  // define variables globally needed
  let server;
  let password;
  let passwordConfirm;
  // 1. Call the server
  beforeAll(async () => {
    const mod = await import("../../../index");
    server = mod.default;
    await User.sequelize.authenticate();
    await Account.sequelize.authenticate();
    // create source account for accountant and manager
    const adminUser = await createAdminUser("manager");
    await createSourceAccount();
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
    database.sequelize.close();
  });
  afterEach(async () => {
    await Account.destroy({ where: {}, truncate: false });
    await User.destroy({ where: {}, truncate: false });
  });

  /*****************************************/
  /***************SIGNUP TEST**************/
  /****************************************/
  describe("SignUp_Tests", () => {
    it("Test_SignUp It should return 400 if no signup data was provided", async () => {
      const res = await request(server).post("/api/v1/users/signup");
      expect(res.status).toBe(400);
    });
    it("Test_SignUp It should return 400 if the provided email was not found", async () => {
      const email = RandomVal.GenRandomValidEmail();
      const len = RandomVal.GenRandomIntegerInRange(8, 12);
      const password = RandomVal.GenRandomValidString(len);
      const passwordConfirm = password;
      const res = await request(server)
        .post("/api/v1/users/signup")
        .send({ email, password, passwordConfirm });
      expect(res.status).toBe(404);
    });
    beforeEach(() => {
      password = "pass1234";
      passwordConfirm = password;
    });
    it("Test_SignUp It should return 403 if the user is already signup", async () => {
      // 1. Insert user into the database
      const oUser = UnitTest.GenRandomValidUserWithPassword();
      const UserResult = await User.create(oUser);

      // 2. Create user account
      const oAccount = UnitTest.GenRandomValidUserAccount(UserResult.id);

      await Account.create({ oAccount });

      // 3. SignUp with email
      const res = await request(server).post("/api/v1/users/signup").send({
        email: oUser.email,
        password,
        passwordConfirm,
      });
      expect(res.status).toBe(403);
    });
    it("Test_SignUp It should return 201 if the user is successfully sign up", async () => {
      // 1. Insert user into the database
      const oUser = UnitTest.GenRandomValidUser();
      const UserResult = await User.create(oUser);

      // 2. Create user account
      const oAccount = UnitTest.GenRandomValidUserAccount(UserResult.id);

      await Account.create(oAccount);

      // 3. SignUp with email
      const res = await request(server).post("/api/v1/users/signup").send({
        email: oUser.email,
        password,
        passwordConfirm,
      });
      expect(res.status).toBe(201);
      const data = JSON.parse(res.text);
      expect(data.status).toBe("success");
      //TODO: Uncomment to line when the user_id will be auto-generated
      // Object.keys(data.data.user).forEach((el) => {
      //   expect(data.data.user).toHaveProperty(el, oUser[el]);
      // });
      // 5. If user role is accountant or manager, make sure account of type source
      if (
        data.data.user.role === "manager" ||
        data.data.user.role === "accountant"
      ) {
        expect(data.data.user.account.type).toBe("source");
        expect(data.data.user.account.name).toBe("source");
      }
    });
  });
  /*****************************************/
  /***************SIGNIN TEST**************/
  /****************************************/
  describe("SignIn_Tests", () => {
    it("Test_Signin It Should return 400 for no email or password", async () => {
      const res = await request(server).post("/api/v1/users/signin");
      expect(res.status).toBe(400);
    });
    it("Test_Signin It Should return 404 if the user is not found", async () => {
      const email = RandomVal.GenRandomValidEmail();
      const password = RandomVal.GenRandomValidString(
        RandomVal.GenRandomInteger(MAX)
      );
      const res = await request(server)
        .post("/api/v1/users/signin")
        .send({ email, password });
      expect(res.status).toBe(404);
    });
    it("Test_Signin It Should return 403 if the user is in active", async () => {
      // 1. Generate valid user
      const user = UnitTest.GenRandomValidUserWithPassword();
      user.active = false;

      // 2. Save user in the database
      await User.create(user);

      // 3. Call test
      const res = await request(server)
        .post("/api/v1/users/signin")
        .send({ email: user.email, password: user.password });
      expect(res.status).toBe(403);
    });
    it("Test_Signin It Should return 401 for wrong password", async () => {
      // 1. Generate valid user
      const user = UnitTest.GenRandomValidUserWithPassword();

      // 2. Save user in the database
      await User.create(user);

      // 3. Generate a different password
      const password = RandomVal.GenRandomValidString(12);

      // 4. Call test
      const res = await request(server)
        .post("/api/v1/users/signin")
        .send({ email: user.email, password });
      expect(res.status).toBe(401);
    });
    it("Test_Signin It Should return 200 for successful login", async () => {
      // 1. Generate valid user
      let user = UnitTest.GenRandomValidUserWithPassword();

      // 2. hash password before saving user
      const newPassword = user.password; // save unhashed password
      user.password = await bcrypt.hash(user.password, 12);
      user.passwordConfirm = user.password;

      // 3. Save user in the database
      const newUser = await User.create(user);

      // 4. Generate random valid account
      const account = UnitTest.GenRandomValidUserAccount(newUser.id, "user");

      // 5. Save account in the database
      await Account.create(account);

      // 4. Call test
      const res = await request(server)
        .post("/api/v1/users/signin")
        .send({ email: user.email, password: newPassword });
      expect(res.status).toBe(200);
      const data = JSON.parse(res.text);
      expect(data.status).toBe("success");
      //TODO: Uncomment to line when the user_id will be auto-generated
      // Object.keys(data.data.user).forEach((el) => {
      //   expect(data.user).toHaveProperty(el, user[el]);
      // });
      // 5. If user role is accountant or manager, make sure account of type source
      if (
        data.data.user.role === "manager" ||
        data.data.user.role === "accountant"
      ) {
        expect(data.data.user.account.type).to.eql("source");
        expect(data.data.user.account.name).to.eql("source");
      }
    });
  });
  // /**********************/
  // /**UPDATE MY PASSWORD*/
  // /********************/
  // describe("PATCH /api/v1/users/updateMyPassword", () => {
  //   it.only("Test_UpdateMyPassword It should return 401 if the current password is wrong", async () => {
  //     // 1. Generate valid user
  //     let user = UnitTest.GenRandomValidUserWithPassword();

  //     // 2. hash password before saving user
  //     const password = user.password; // save unhashed password
  //     user.password = await bcrypt.hash(user.password, 12);
  //     user.passwordConfirm = user.password;

  //     // 3. Save user in the database
  //     const newUser = await User.create(user);

  //     // 4. Generate random valid account
  //     const account = UnitTest.GenRandomValidUserAccount(newUser.id, "user");

  //     // 5. Save account in the database
  //     await Account.create(account);

  //     // 4. Call test
  //     const res = await request(server)
  //       .post("/api/v1/users/signin")
  //       .send({ email: user.email, password });
  //     //expect(res.status).toBe(200);
  //     console.log(res.text);
  //     const data = JSON.parse(res.text);
  //     //expect(data.status).toBe("success");
  //   });
  // });
});
