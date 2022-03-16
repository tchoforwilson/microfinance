"use strict";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import database from "../config/database.js";
import * as factory from "./handleFactory.js";
const User = database.user;
const Source = database.source;
const Customer = database.customer;
const Account = database.account;
const Transaction = database.transaction;
const Op = database.Sequelize.Op;

const excludes = [
  "password",
  "password_confirm",
  "password_changed_at",
  "createdAt",
  "updatedAt",
  "rights",
];

export const creditMe = catchAsync(async (req, res, next) => {
  // 1. Get user
  const user = await User.findByPk(parseInt(req.user.user_id, 10));
  // 2. Get user account
  const account = await user.getAccount();

  // 3. Select source
  const source = await Source.findByPk(req.body.source_id);
  if (!source) {
    return next(new AppError("No source found with this ID!", 404));
  }
  if (source.balance === 0) {
    return next(new AppError("0.0 XAF Balance ", 400));
  }
  // 4. Credit user account
  account.balance += parseInt(req.body.amount);
  // 5. Change source balance
  source.balance -= parseInt(req.body.amount);

  // 4. save results
  await account.save();
  await source.save();

  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    data: {
      account,
    },
  });
});

export const creditUser = catchAsync(async (req, res, next) => {
  const { amount, user_id } = req.body;
  // 1. Check if funds is sufficient
  if (req.user.account.balance < amount) {
    return next(
      new AppError(
        `Insufficient funds! Balance: ${req.user.account.balance}`,
        400
      )
    );
  }
  // 2. Get user
  const user = await User.findByPk(parseInt(user_id));
  if (!user) {
    return next(new AppError("No user found with this ID!", 404));
  }
  const account = await user.getAccount();

  // 3. Check if account is active
  if (!account.active) {
    return next(new AppError("Account close!", 400));
  }

  // 4. Credit user account with amount from source
  account.balance += amount;
  req.user.account.balance -= amount;
  await req.user.account.save();
  await account.save();

  res.status(200).json({
    status: "success",
    data: {
      account,
    },
  });
});

export const deposit = catchAsync(async (req, res, next) => {
  // 1. Get amount and account id
  const { amount, account_id } = req.body;

  // 2. Get current user
  const currentUser = await User.findByPk(parseInt(req.user.user_id, 10));

  // 3. Get current user account
  const currentAccount = await currentUser.getAccount();

  if (currentAccount.balance < amount) {
    return next(
      new AppError(
        `Insufficient funds! Balance: ${currentAccount.balance} FCFA`,
        400
      )
    );
  }

  const account = await Account.findByPk(parseInt(account_id));
  if (!account) {
    return next(new AppError("No account found with this ID!", 404));
  }

  // TODO: What if the account is closed
  // 3. Check if account is active
  if (!account.active) {
    return next(new AppError("Account close!", 400));
  }
  // Make sure we are depositing into a customer account
  if (account.type !== "customer") {
    return next(new AppError("Not a customer account!", 400));
  }

  if (amount < 500 || amount > 1000000) {
    return next(new AppError(`Invalid amount! Amount: ${amount} FCFA`, 400));
  }
  account.balance += amount;
  currentAccount.balance -= amount;

  const transaction = await Transaction.create({
    type: "deposit",
    amount,
    user_id: req.user.user_id,
    account_id: account.account_id,
    balance: account.balance,
  });

  // Save results of transaction
  await currentAccount.save();
  await account.save();

  res.status(200).json({
    status: "success",
    data: {
      transaction,
    },
  });
});

export const withdraw = catchAsync(async (req, res, next) => {
  // 1. Get amount and account_id
  const { amount, account_id } = req.body;

  // 2. Get customer account
  const account = await Account.findByPk(parseInt(account_id));
  if (!account) {
    return next(new AppError("No account found with this ID!", 404));
  }

  //TODO: What if account is closed
  // 3. Check if account is active
  if (!account.active) {
    return next(new AppError("Account close!", 400));
  }
  // 4. Make sure we are withdrawing from a customer account
  if (account.type !== "customer") {
    return next(new AppError("Not a customer account!", 400));
  }

  // 4. Calculate the amount
  let amt = (amount * 5) / 100;
  let totalAmount = amt + amount;
  if (totalAmount > account.balance) {
    return next(
      new AppError(`Insufficient amount! Balance: ${account.balance} FCFA`, 400)
    );
  }
  account.balance -= totalAmount;

  const transaction = await Transaction.create({
    type: "withdrawal",
    amount,
    user_id: req.user.user_id,
    account_id: account.account_id,
    balance: account.balance,
  });

  await account.save(); // save result

  res.status(200).json({
    status: "success",
    data: {
      transaction,
    },
  });
});

export const getTransaction = catchAsync(async (req, res, next) => {
  // 1. Get Transaction
  const transaction = await Transaction.findByPk(parseInt(req.params.id, 10));
  // 2. Check if transaction exist
  if (!transaction) {
    return next(new AppError("No transaction found with this ID!", 404));
  }
  // 2. Get user and account involve
  const user = await User.findByPk(transaction.user_id, {
    attributes: { exclude: excludes },
  });
  const account = await Account.findByPk(transaction.account_id);
  const customer = await Customer.findByPk(parseInt(account.customer_id, 10));

  const data = { ...transaction.dataValues, user, account, customer };

  // Send response
  res.status(200).json({
    status: "success",
    data: {
      data,
    },
  });
});

export const getTransactions = factory.getAll(Transaction);

/**
 * To delete a transaction, means it was invalid
 * And we need to restore the account to their original states
 */
export const deleteTransaction = catchAsync(async (req, res, next) => {
  // 1. Get transaction
  const transaction = await Transaction.findByPk(parseInt(req.params.id));

  // 2. Check if transaction exist
  if (!transaction) {
    return next(new AppError("No transaction found with this ID!", 404));
  }

  // 3. Get user and customer involve in transaction
  const customerAccount = await Account.findByPk(
    parseInt(transaction.account_id, 10)
  );
  const user = await User.findByPk(parseInt(transaction.user_id, 10));

  const userAccount = await user.getAccount();
  /**
   * If the transaction is a deposit, we want to remove the same amount from customer account
   * and credit the user amount with the amount
   */
  if (transaction.type === "deposit") {
    userAccount.balance += transaction.amount;
    customerAccount.balance -= transaction.amount;
  } else if (transaction.type === "withdrawal") {
    let amt = (transaction.amount * 5) / 100; // add charges back to transaction
    let totalAmount = amt + transaction.amount;
    customerAccount.balance += totalAmount;
  } else {
    return next(new AppError("Transaction not found!", 404));
  }

  // 4. Destroy transaction
  const trans = await Transaction.destroy({
    where: { transaction_id: parseInt(req.params.id, 10) },
  });

  if (trans[0] === 0) {
    return next(
      new AppError(
        `Cannot delete transaction with ID ${req.params.id}! not found`,
        404
      )
    );
  }

  await userAccount.save();
  await customerAccount.save();

  res.status(200).json({
    status: "success",
    data: null,
  });
});

export const sumTransactions = catchAsync(async (req, res, next) => {
  const sum = await Transaction.sum("amount", { where: req.body });
  const count = await Transaction.count({ where: req.body });

  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    data: {
      sum,
      count,
    },
  });
});
