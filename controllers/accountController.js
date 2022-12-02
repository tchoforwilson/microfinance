import database from '../config/database';
import catchAsync from '../utils/catchAsync';
import * as factory from './handlerFactory';
import * as statistic from '../utils/statistic';

const Account = database.account;

export const setCustomerId = (req, res, next) => {
  if (!req.body.customer) req.body.customer = req.params.id;
  next();
};

export const getSumAllCustomersBalance = catchAsync(async (req, res, next) => {
  // 1. Get Sum
  const sum = await statistic.getSum(Account, 'balance');

  res.status(200).json({
    status: 'success',
    data: {
      totalAmount: sum,
    },
  });
});

export const getAllAccounts = factory.getAll(Account);
export const getAccount = factory.getOne(Account, 'active', 'user');
export const updateAccount = factory.updateOne(Account, 'name');
export const deleteAccount = factory.deleteOne(Account);
