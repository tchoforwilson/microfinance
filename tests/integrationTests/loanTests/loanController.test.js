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
const Loan = database.loan;
const Op = database.Sequelize.Op;

describe("LoanController_Tests", () => {
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
    await Loan.sequelize.authenticate();
    adminUser = await createAdminUser("manager");
    header = getHeader(adminUser);
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
    // close all database connections
    await database.sequelize.close();
  });
  afterEach(async () => {
    await Loan.destroy({ where: {}, truncate: false });
    await Account.destroy({ where: {}, truncate: false });
    await Customer.destroy({ where: {}, truncate: false });
    await Zone.destroy({ where: {}, truncate: false });
    await User.destroy({
      where: { [Op.not]: [{ id: adminUser.id }] },
      truncate: false,
    });
  });
  describe("POST /api/v1/loans", () => {
    it("Test_CreateLoan It should return 404 if the customer is not found", async () => {
      // 1. Generate random valid number as customer id
      const id = RandomVal.GenRandomInteger(MAX);
      // 2. Generate random valid loan
      const loan = UnitTest.GenRandomValidLoan(id);
      // 3. Send request
      const res = await request(server)
        .post("/api/v1/loan")
        .set("Authorization", header)
        .send(loan);
      // 4. expect result
      expect(res.status).toBe(404);
    });
    it("Test_CreateLoan It should return 400 if amount is less than the minimum amount", async () => {
      // 1. Generate and create a valid zone
      // .a generate a valid zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);
      // 2. Generate and create a valid customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customer
      const customer = await Customer.create(genCustomer);
      // 3. Set amount to a less than minimum of maximum value
      let amount = 0;
      if (RandomVal.GenRandomBoolean()) {
        amount = 400;
      } else {
        amount = 2000000;
      }
      // 3. Generate random valid loan
      const loan = UnitTest.GenRandomValidLoan(customer.id);
      loan.amount = amount;
      // 4. Send request
      const res = await request(server)
        .post("/api/v1/loans")
        .set("Authorization", header)
        .send(loan);
      // 5. expect result
      expect(res.status).toBe(400);
    });
    it("Test_CreateLoan It should return 400 for invalid interestRate", async () => {
      // 1. Generate and create a valid zone
      // .a generate a valid zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);
      // 2. Generate and create a valid customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customer
      const customer = await Customer.create(genCustomer);
      // 3. Generate random valid loan
      const loan = UnitTest.GenRandomValidLoan(customer.id);
      // a. set interestRate to an invalid value
      loan.interestRate = RandomVal.GenRandomInteger(MAX);
      // 4. Send request
      const res = await request(server)
        .post("/api/v1/loans")
        .set("Authorization", header)
        .send(loan);
      // 5. expect result
      expect(res.status).toBe(400);
    });
    it("Test_CreateLoan It should return 200 if the loan is successfully created", async () => {
      // 1. Generate and create a valid zone
      // .a generate a valid zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);
      // 2. Generate and create a valid customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customer
      const customer = await Customer.create(genCustomer);
      // 3. Generate random valid loan
      let loan = {};
      loan.amount = 500000;
      loan.customer = customer.id;
      // a. set interestRate to an invalid value
      loan.interestRate = 0.5; // TODO: This should be generated randomly
      // 4. Send request
      const res = await request(server)
        .post("/api/v1/loans")
        .set("Authorization", header)
        .send(loan);
      // 5. expect result
      expect(res.status).toBe(200);
      const { data } = JSON.parse(res.text);
      expect(data.loan.status).toBe("unpaid");
    });
  });
  describe("PATCH /api/v1/loans/prepayment", () => {
    it("Test_Prepayment It should return 404 if the loan is not found", async () => {
      // 1. Generate random valid number as id
      const id = RandomVal.GenRandomInteger(MAX);
      const amount = RandomVal.GenRandomBigAmount();
      // 2. Send request
      const res = await request(server)
        .post("/api/v1/loans/prepayment")
        .set("Authorization", header)
        .send({ id, amount });
      // 3. Expect result
      expect(res.status).toBe(404);
    });
    it("Test_Prepayment It should return 400 if the amount is greater than the loan amount", async () => {
      // 1. Generate and create a valid zone
      // .a generate a valid zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);
      // 2. Generate and create a valid customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customer
      const customer = await Customer.create(genCustomer);
      // 3. Generate and create loan
      // a. generate loan
      const genLoan = UnitTest.GenRandomValidLoan(customer.id);
      genLoan.interestRate = 0.5;
      // b. create loan
      const loan = await Loan.create(genLoan);
      const amount = RandomVal.GenRandomBigAmount();

      // 4. Send request
      const res = await request(server)
        .patch("/api/v1/loans/prepayment")
        .set("Authorization", header)
        .send({ id: loan.id, amount });

      // 5. Expect result
      expect(res.status).toBe(400);
    });
    it("Test_Prepayment It should return 200 if the loan is prepaid", async () => {
      // 1. Generate and create a valid zone
      // .a generate a valid zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);
      // 2. Generate and create a valid customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customer
      const customer = await Customer.create(genCustomer);
      // 3. Generate and create loan
      // a. generate loan
      const genLoan = UnitTest.GenRandomValidLoan(customer.id);
      genLoan.amount = RandomVal.GenRandomBigAmount();
      genLoan.balance = genLoan.amount;
      genLoan.interestRate = 0.5;
      // b. create loan
      const loan = await Loan.create(genLoan);
      const amount = RandomVal.GenRandomSmallAmount();

      // 4. Send request
      const res = await request(server)
        .patch("/api/v1/loans/prepayment")
        .set("Authorization", header)
        .send({ id: loan.id, amount });

      // 5. Expect result
      expect(res.status).toBe(201);
      const { data } = JSON.parse(res.text);
      // TODO: check that loan balance is less than loan amount
      //expect(data.loan.balance).toBeLestThan(genLoan.amount);
    });
  });
  describe("PATCH /api/v1/loans/recover", () => {
    it("Test_RecoverLoan It should return 404 if the loan is not found", async () => {
      // 1. Generate random number as id and account and amount
      const id = RandomVal.GenRandomInteger(MAX);
      const account = RandomVal.GenRandomInteger(MAX);
      const amount = RandomVal.GenRandomInteger(MAX);

      // 2. send request
      const res = await request(server)
        .patch("/api/v1/loans/recover")
        .set("Authorization", header)
        .send({ id, account, amount });

      // 3. Expect result
      expect(res.status).toBe(404);
    });
    it("Test_RecoverLoan It should return 400 if the loan is paid or balance is zero", async () => {
      // 1. Generate and create a valid zone
      // .a generate a valid zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);
      // 2. Generate and create a valid customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customer
      const customer = await Customer.create(genCustomer);
      // 3. Generate and create loan
      // a. generate loan
      const genLoan = UnitTest.GenRandomValidLoan(customer.id);
      genLoan.amount = RandomVal.GenRandomBigAmount();
      genLoan.balance = 0;
      genLoan.interestRate = 0.5;
      genLoan.status = "paid";
      // b. create loan
      const loan = await Loan.create(genLoan);

      // 4. Generate random amount and account id
      const amount = RandomVal.GenRandomSmallAmount();
      const account = RandomVal.GenRandomInteger(MAX);

      // 5. Send request
      const res = await request(server)
        .patch("/api/v1/loans/recover")
        .set("Authorization", header)
        .send({ id: loan.id, amount, account });
      // 6. Expect result
      expect(res.status).toBe(400);
    });
    it("Test_RecoverLoan It should recover 404 if the account is not found", async () => {
      // 1. Generate and create a valid zone
      // .a generate a valid zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);
      // 2. Generate and create a valid customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customer
      const customer = await Customer.create(genCustomer);
      // 3. Generate and create loan
      // a. generate loan
      const genLoan = UnitTest.GenRandomValidLoan(customer.id);
      genLoan.amount = RandomVal.GenRandomBigAmount();
      genLoan.balance = genLoan.amount;
      genLoan.interestRate = 0.5;
      // b. create loan
      const loan = await Loan.create(genLoan);

      // 4. Generate random amount and account id
      const amount = RandomVal.GenRandomSmallAmount();
      const account = RandomVal.GenRandomInteger(MAX);

      // 5. Send request
      const res = await request(server)
        .patch("/api/v1/loans/recover")
        .set("Authorization", header)
        .send({ id: loan.id, amount, account });
      // 6. Expect result
      expect(res.status).toBe(404);
    });
    it("Test_RecoverLoan It should return 400 if the customer is inactive", async () => {
      // 1. Generate and create a valid zone
      // .a generate a valid zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);
      // 2. Generate and create a valid customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customer
      const customer = await Customer.create(genCustomer);
      // 3. Generate and create random account
      // a. generate account
      const genAccount = UnitTest.GenRandomValidCustomerAccount(customer.id);
      genAccount.active = false;
      // b. create account
      const account = await Account.create(genAccount);

      // 4. Generate and create loan
      // a. generate loan
      const genLoan = UnitTest.GenRandomValidLoan(customer.id);
      genLoan.amount = RandomVal.GenRandomBigAmount();
      genLoan.balance = genLoan.amount;
      genLoan.interestRate = 0.5;
      // b. create loan
      const loan = await Loan.create(genLoan);

      // 4. Generate random amount and account id
      const loanAmount = RandomVal.GenRandomSmallAmount();

      // 5. Send request
      const res = await request(server)
        .patch("/api/v1/loans/recover")
        .set("Authorization", header)
        .send({ id: loan.id, amount: loanAmount, account: account.id });
      // 6. Expect result
      expect(res.status).toBe(400);
    });
    it("Test_RecoverLoan It should return 400 if the account is not a customer account", async () => {
      // 1. Generate and create a valid zone
      // .a generate a valid zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);
      // 2. Generate and create two valid customer
      // a. generate customer
      const genCustomer1 = UnitTest.GenRandomValidCustomer(zone.id);
      const genCustomer2 = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customers
      const customer1 = await Customer.create(genCustomer1);
      const customer2 = await Customer.create(genCustomer2);
      // 3. Generate and create two random account
      // a. generate account
      const genAccount1 = UnitTest.GenRandomValidCustomerAccount(customer1.id);
      const genAccount2 = UnitTest.GenRandomValidCustomerAccount(customer2.id);
      // b. create account
      const account1 = await Account.create(genAccount1);
      const account2 = await Account.create(genAccount2);

      // 4. Generate and create loan
      // a. generate loan
      const genLoan = UnitTest.GenRandomValidLoan(customer1.id);
      genLoan.amount = RandomVal.GenRandomBigAmount();
      genLoan.balance = genLoan.amount;
      genLoan.interestRate = 0.5;
      // b. create loan
      const loan = await Loan.create(genLoan);

      // 4. Generate random amount and account id
      const loanAmount = RandomVal.GenRandomSmallAmount();

      // 5. Send request
      const res = await request(server)
        .patch("/api/v1/loans/recover")
        .set("Authorization", header)
        .send({ id: loan.id, amount: loanAmount, account: account2.id });
      // 6. Expect result
      expect(res.status).toBe(400);
    });
    it("Test_RecoverLoan It should return 400 if the account balance is insufficient", async () => {
      // 1. Generate and create a valid zone
      // .a generate a valid zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);
      // 2. Generate and create two valid customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customers
      const customer = await Customer.create(genCustomer);
      // 3. Generate and create two random account
      // a. generate account
      const genAccount = UnitTest.GenRandomValidCustomerAccount(customer.id);
      genAccount.balance = 0;
      // b. create account
      const account = await Account.create(genAccount);

      // 4. Generate and create loan
      // a. generate loan
      const genLoan = UnitTest.GenRandomValidLoan(customer.id);
      genLoan.amount = RandomVal.GenRandomBigAmount();
      genLoan.balance = genLoan.amount;
      genLoan.interestRate = 0.5;
      // b. create loan
      const loan = await Loan.create(genLoan);

      // 4. Generate random amount and account id
      const loanAmount = RandomVal.GenRandomSmallAmount();

      // 5. Send request
      const res = await request(server)
        .patch("/api/v1/loans/recover")
        .set("Authorization", header)
        .send({ id: loan.id, amount: loanAmount, account: account.id });
      // 6. Expect result
      expect(res.status).toBe(400);
    });
    it("Test_RecoverLoan It should return 200 if the loan is successfully recovered", async () => {
      // 1. Generate and create a valid zone
      // .a generate a valid zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);
      // 2. Generate and create two valid customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customers
      const customer = await Customer.create(genCustomer);
      // 3. Generate and create two random account
      // a. generate account
      const genAccount = UnitTest.GenRandomValidCustomerAccount(customer.id);
      // b. create account
      const account = await Account.create(genAccount);

      // 4. Generate and create loan
      // a. generate loan
      const genLoan = UnitTest.GenRandomValidLoan(customer.id);
      genLoan.amount = RandomVal.GenRandomSmallAmount();
      genLoan.balance = genLoan.amount;
      genLoan.interestRate = 0.5;
      // b. create loan
      const loan = await Loan.create(genLoan);

      // 4. Generate random amount and account id
      const loanAmount = RandomVal.GenRandomSmallAmount();

      // 5. Send request
      const res = await request(server)
        .patch("/api/v1/loans/recover")
        .set("Authorization", header)
        .send({ id: loan.id, amount: loanAmount, account: account.id });
      // 6. Expect result
      expect(res.status).toBe(200);
      const { data } = JSON.parse(res.text);
      expect(data.account).toBe(account.id);
      expect(data.loan.status).toBe("unfinished");
    });
  });
  describe("GET /api/v1/loans/sumUnpaidLoan", () => {
    it("Test_GetSumUnPaidLoan It should return 200 for the sum of unpaid loans", async () => {
      // 1. Generate and create a valid zone
      // .a generate a valid zone
      const genZone = UnitTest.GenRandomValidZone(adminUser.id);
      // b. create zone
      const zone = await Zone.create(genZone);
      // 2. Generate and create two valid customer
      // a. generate customer
      const genCustomer = UnitTest.GenRandomValidCustomer(zone.id);
      // b. create customers
      const customer = await Customer.create(genCustomer);

      // 3. Generate and create loan
      for (var i = 0; i < MIN; i++) {
        // a. generate loan
        const genLoan = UnitTest.GenRandomValidLoan(customer.id);
        genLoan.amount = RandomVal.GenRandomSmallAmount();
        genLoan.balance = genLoan.amount;
        // set array of interestRate
        const interestRates = [0.5, 0.75, 0.95, 0.65];
        genLoan.interestRate =
          RandomVal.GenRandomSingleItemFromArray(interestRates);
        await Loan.create(genLoan);
      }
      // 4. Send request
      const res = await request(server)
        .get("/api/v1/loans/sumUnpaidLoan")
        .set("Authorization", header);
      // 5. Expect result
      expect(res.status).toBe(200);
      const { data } = JSON.parse(res.text);
      expect(data.sum).notNull;
    });
  });
});
