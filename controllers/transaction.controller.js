import fs from 'fs';
import _ from 'lodash';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import database from '../config/database.js';
import { getSum, getStartEndMonth } from '../utils/statistic.js';
import * as factory from './handler.factory.js';

const Op = database.Sequelize.Op;
const Account = database.account;
const Transaction = database.transaction;

const excludedFields = ['createdAt', 'updatedAt'];

// Read setting from setting file
const settings = JSON.parse(
  fs.readFileSync(new URL('../config/settings.json', import.meta.url), 'utf-8')
);

/**
 * @brief Get the charge to be deducted from a account
 * based on the amount provided
 * @param {Number} amount
 * @return {Number} charge
 */
function getMonthlyTariff(amount) {
  const tariffs = _.get(settings, 'tariffs');
  tariffs.forEach((tariff) => {
    if (amount > tariff.from && amount <= tariff?.to) {
      return tariff.charge;
    }
  });
}

export const deposit = catchAsync(async (req, res, next) => {
  // 1. Get amount and account id
  const { amount, account } = req.body;

  if (amount < settings.minDepositAmount) {
    return next(new AppError(`Invalid amount! Amount: ${amount} FCFA`, 400));
  }

  // 3. Get customer account
  const customerAccount = await Account.findByPk(account);

  // 4. Check if customer account exist
  if (!customerAccount) {
    return next(new AppError('No account found with this ID!', 404));
  }

  // 3. Check if account is active
  if (!customerAccount.active) {
    return next(new AppError('Account closed!', 400));
  }

  customerAccount.balance += amount;

  const transaction = await Transaction.create({
    type: 'deposit',
    user: req.user.id,
    amount,
    account: customerAccount.id,
    balance: customerAccount.balance,
  });

  // Save results of transaction
  await customerAccount.save();

  res.status(200).json({
    status: 'success',
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

  // 3. Check if account exist
  if (!customerAccount) {
    return next(new AppError('No account found with this ID!', 404));
  }

  // 4. Check if account is active
  if (!customerAccount.active) {
    return next(new AppError('Account close!', 400));
  }

  customerAccount.balance -= amount;

  const transaction = await Transaction.create({
    type: 'withdrawal',
    user: req.user.id,
    amount,
    account: customerAccount.id,
    balance: customerAccount.balance,
  });

  await customerAccount.save(); // save result

  res.status(200).json({
    status: 'success',
    data: {
      transaction,
    },
  });
});

export const getTransaction = factory.getOne(Transaction, ...excludedFields);
export const getAllTransactions = factory.getAll(Transaction);

export const monthlyDeduction = catchAsync(async (req, res, next) => {
  // 1. Get all accounts
  const accounts = await Account.findAll();

  // 2. Check if accounts exists
  if (!accounts || accounts.length < 1) {
    return next(new AppError('No accounts found!', 404));
  }
  // 3. Build the date
  const { startDate, endDate } = getStartEndMonth();
  let totalAmount = 0;
  accounts.forEach(async (account) => {
    const filter = {
      [Op.and]: [
        { account: account.id },
        { type: 'deposit' },
        { date: { [Op.between]: [startDate, endDate] } },
      ],
    };
    const acct = await Account.findByPk(account.id); // Get account
    const sum = await getSum(Transaction, 'amount', filter);
    // 4. Deduct tariff from the persons account
    const tariff = getMonthlyTariff(sum);
    console.log(tariff);
    // acct.balance -= tariff;
    totalAmount += tariff; // sum tariff deducted
  });
  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    data: {
      totalAmount,
    },
  });
});
