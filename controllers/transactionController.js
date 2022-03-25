"use strict";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import database from "../config/database.js";
import * as statistic from "../utils/statistic.js";
import * as factory from "./handlerFactory.js";
const User = database.user;
const Account = database.account;
const Transaction = database.transaction;
const Op = database.Sequelize.Op;

const excludedFields = ["createdAt", "updatedAt"];

const getMonthlyTariff = (amount) => {
  if (amount > 3500 && amount <= 20000) {
    return 450;
  }
  if (amount > 20001 && amount <= 40000) {
    return 800;
  }
  if (amount > 40001 && amount <= 60000) {
    return 1150;
  }
  if (amount > 60001 && amount <= 80000) {
    return 1500;
  }
  if (amount > 80001 && amount <= 100000) {
    return 1900;
  }
  if (amount > 100001) {
    return 2300;
  }
  return 0;
};

export const creditCollector = catchAsync(async (req, res, next) => {
  const { amount, collector } = req.body;
  // 1. Check if funds is sufficient
  if (req.user.account.balance < amount) {
    return next(
      new AppError(
        `Insufficient funds! Balance: ${req.user.account.balance}`,
        400
      )
    );
  }

  // 2. Get collector and check if user is active
  const user = await User.findByPk(collector);
  if (!user) {
    return next(new AppError("No user found with this ID!", 404));
  }

  // 3. Check if it is an active collector
  if (!user.active) {
    return next(new AppError("In active user!", 400));
  }

  // 4. Check that user is a collector
  if (user.role !== "collector") {
    return next(
      new AppError(`Invalid user selected with role ${user.role}`, 400)
    );
  }

  // 5. Get user account and check if account is active
  const account = await Account.findOne({ where: { user: collector } });

  // 6. Check if account is not closed
  if (!account.active) {
    return next(new AppError("Can't perform action, Account closed!", 400));
  }

  // 7. Credit user account with amount from source
  account.balance += amount;
  req.user.account.balance -= amount;
  await req.user.account.save();
  await account.save();

  res.status(200).json({
    status: "success",
    data: {
      user,
      account,
    },
  });
});

export const deposit = catchAsync(async (req, res, next) => {
  // 1. Get amount and account id
  const { amount, account } = req.body;

  if (amount < 500) {
    return next(new AppError(`Invalid amount! Amount: ${amount} FCFA`, 400));
  }

  // 2. Check if user have enough balance
  if (req.user.account.balance < amount) {
    return next(
      new AppError(
        `Insufficient funds! Balance: ${currentAccount.balance} FCFA`,
        400
      )
    );
  }

  // 3. Get customer account
  const customerAccount = await Account.findByPk(account);

  // 4. Check if customer account exist
  if (!customerAccount) {
    return next(new AppError("No account found with this ID!", 404));
  }

  // 3. Check if account is active
  if (!customerAccount.active) {
    return next(new AppError("Account closed!", 400));
  }
  // Make sure we are depositing into a customer account
  if (customerAccount.type !== "customer") {
    return next(new AppError("Not a customer account!", 400));
  }

  customerAccount.balance += amount;
  req.user.account.balance -= amount;

  const transaction = await Transaction.create({
    type: "deposit",
    user: req.user.id,
    amount,
    account: customerAccount.id,
    userBalance: req.user.account.balance,
    accountBalance: customerAccount.balance,
  });

  if (!transaction) {
    return next(new AppError("Something went wrong!", 500));
  }

  // Save results of transaction
  await customerAccount.save();
  await req.user.account.save();

  res.status(200).json({
    status: "success",
    data: {
      transaction,
    },
  });
});

export const withdraw = catchAsync(async (req, res, next) => {
  // 1. Get amount and account
  const { amount, account } = req.body;

  // 2. Get customer account
  const customerAccount = await Account.findByPk(account);
  if (!customerAccount) {
    return next(new AppError("No account found with this ID!", 404));
  }

  // 3. Check if account is active
  if (!customerAccount.active) {
    return next(new AppError("Account close!", 400));
  }
  // 4. Make sure we are withdrawing from a customer account
  if (customerAccount.type !== "customer") {
    return next(new AppError("Not a customer account!", 400));
  }

  // 4. Calculate the amount
  let tariff = getMonthlyTariff(customerAccount.balance);
  let totalAmount = tariff + amount;
  if (totalAmount > customerAccount.balance) {
    return next(
      new AppError(
        `Insufficient amount! Balance: ${customerAccount.balance} FCFA`,
        400
      )
    );
  }
  customerAccount.balance -= amount;

  const transaction = await Transaction.create({
    type: "withdrawal",
    user: req.user.id,
    amount,
    account: customerAccount.id,
    userBalance: req.user.account.balance,
    accountBalance: customerAccount.balance,
  });

  if (!transaction) {
    return next(new AppError("Error performing transaction!", 500));
  }

  await customerAccount.save(); // save result

  res.status(200).json({
    status: "success",
    data: {
      transaction,
    },
  });
});

export const getTransaction = factory.getOne(Transaction, excludedFields);
export const getTransactions = factory.getAll(Transaction);

export const performMonthlyTariff = catchAsync(async (req, res, next) => {
  // 1. Build the date
  const { startDate, endDate } = statistic.getStartEndMonth();

  // 2. Get account
  const accounts = await Account.findAndCountAll({
    where: { type: "customer" },
  });

  const { rows } = accounts; // get count and rows

  // 3. Check if accounts exists
  if (!accounts) {
    return next(new AppError("No accounts found!", 404));
  }

  // 3. Perform withdrawal for each account
  let totalAmount = 0;
  rows.forEach(async (row) => {
    const filter = {
      [Op.and]: [
        { account: row.id },
        { type: "deposit" },
        { date: { [Op.between]: [startDate, endDate] } },
      ],
    };
    const sum = await statistic.getSum(Transaction, "amount", filter);
    const account = await Account.findByPk(row.id); // Get account

    // 4. Deduct tariff from the persons account
    const tariff = getMonthlyTariff(sum);
    account.balance -= tariff;
    totalAmount += tariff; // sum tariff deducted

    await account.save();
  });

  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    data: {
      accounts,
      totalAmount,
    },
  });
});
