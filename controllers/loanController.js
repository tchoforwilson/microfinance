"use strict";
import AppError from "./../utils/appError.js";
import catchAsync from "./../utils/catchAsync.js";
import database from "./../config/database.js";

const Loan = database.loan;
const Customer = database.customer;
const Account = database.account;
const Op = database.Sequelize.Op;

export const setLoanId = (req, res, next) => {
  if (!req.body.loan_id) req.body.loan_id = req.params.loan_id;
  next();
};

export const getAllLoans = catchAsync(async (req, res, next) => {
  const loans = await Loan.findAndCountAll({
    where: req.query,
  });
  if (!loans) {
    return next(new AppError("No loan found", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      loans,
    },
  });
});

export const createLoan = catchAsync(async (req, res, next) => {
  // 1. Get data
  const { amount, interestRate, customer_id } = req.body;
  // 2. Check if customer exist and is active
  const customer = await Customer.findByPk(parseInt(customer_id));
  //TODO: This 👇 should be a future check
  // if (!customer.active) {
  //   return next(new AppError("Customer inactive!", 404));
  // }
  // 3. Make sure amount is not less than zero
  if (amount < 500 || amount > 1000000) {
    return next(
      new AppError("Amount out of range between 500 Frs and 1,000,000 Frs", 400)
    );
  }
  // 4. Make sure interest rate is not greater than 1 and less than 0;
  if (interestRate < 0.0 || interestRate > 0.9) {
    return next(
      new AppError("Invalid interest rate! not in range 0.1% and 0.9% ", 400)
    );
  }
  // 5. Make loan
  const interest = amount * (interestRate / 100);
  const totalAmount = amount + interest;

  // 6. Save loan
  const loan = await Loan.create({
    amount: totalAmount,
    balance: totalAmount,
    customer_id,
  });
  const loanData = loan.dataValues;

  // send response
  res.status(200).json({
    status: "success",
    data: {
      loan: loanData,
      customer,
    },
  });
});

export const getLoan = catchAsync(async (req, res, next) => {
  const loan = await Loan.findByPk(req.params.id);
  if (!loan) {
    return next(new AppError("No loan found with this ID!", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      loan,
    },
  });
});

export const updateLoan = catchAsync(async (req, res, next) => {
  const loan = Loan.update(req.body, {
    where: { loan_id: parseInt(req.params.id, 10) },
    fields: ["amount", "customer_id", "status"],
  });

  // 2. Check if there was an update
  if (loan[0] === 0) {
    return next(new AppError("No loan found with this ID!", 404));
  }

  // SEND RESPONSE

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const deleteLoan = catchAsync(async (req, res, next) => {
  // 1. Get loan
  const loan = await Loan.findByPk(parseInt(req.params.id, 10));

  // 2. Check if loan exist
  if (!loan) {
    return next(new AppError("No loan found with this ID!", 404));
  }

  // 3. Check if loan is paid
  if (loan.balance !== 0 && loan.status !== "paid") {
    return next(new AppError("Loan not recovered or payed!", 400));
  }

  // 4. Delete loan
  await Loan.destroy({ where: { loan_id: parseInt(req.params.id, 10) } });

  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    data: null,
  });
});

/*************
 * @POST /api/mfi/v1/prepayment/
 * @desc This route is made to handle loan prepayment as the name state,
 * the user have to provide an amount that is used to prepay the loan
 * the amount must be equal or less than  the loan balance
 */
export const prepayment = catchAsync(async (req, res, next) => {
  // 1. Get loan id and prepaid amount
  const { loan_id, amount } = req.body;

  // 2. Get for loan
  const loan = await Loan.findByPk(parseInt(loan_id, 10));

  // 3. Check if loan exist
  if (!loan) {
    return next(new AppError("No loan found with this ID!", 404));
  }

  // 4. Check for amount and loan balance
  if (amount > loan.balance) {
    return next(
      new AppError(
        `Invalid amount ${amount}! Amount bigger than loan balance. `,
        400
      )
    );
  }

  // 5. Perform prepayment
  loan.balance -= amount;

  // 6. Update loan status
  loan.balance === 0 ? (loan.status = "paid") : (loan.status = "unfinished");

  // 7. Save result
  await loan.save();

  // SEND RESPONSE
  res.status(201).json({
    status: "success",
    data: {
      loan: loan.dataValues,
    },
  });
});

/*************
 * @POST /api/mfi/v1/recover/
 * @desc This route is made to recover customer loan from a given customer account,
 * the account ID is provided as well as the amount to be deducted from the account
 */

export const recover = catchAsync(async (req, res, next) => {
  // 1. Get loan_id, account_id and amount
  const { loan_id, account_id, amount } = req.body;

  // 2. Get loan
  const loan = await Loan.findByPk(loan_id);

  // 3. Check if loan exist
  if (!loan) {
    return next(new AppError("No loan found with this ID!", 404));
  }

  // 4. Check if loan was paid
  if (loan.balance === 0 && loan.status === "paid") {
    return next(new AppError("Loan is paid!", 400));
  }
  // 5. Get account
  const account = await Account.findByPk(account_id);

  // 6. Check if the account exist
  if (!account) {
    return next(new AppError("No account found with this ID!", 404));
  }
  // 7. Check if account is an active account
  if (!account.active) {
    return next(new AppError("This account is closed!", 400));
  }
  // 8. Check if account belongs to customer
  if (loan.customer_id !== account.customer_id) {
    return next(
      new AppError("This account doesn't belongs to the customer!", 400)
    );
  }
  // 9. Check that the account balance is greater than or equal the amount
  if (account.balance < amount) {
    return next(new AppError(`Insufficient funds! ${account.balance}`, 400));
  }

  // 10. Perform recovery
  account.balance -= amount; // subtract amount from account balance
  loan.balance -= amount; // subtract amount from loan balance

  // 11. Verify if loan is all paid
  loan.balance === 0 ? (loan.status = "paid") : (loan.status = "unfinished");

  // 12. Save result
  await account.save();
  await loan.save();

  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    data: {
      loan,
      account,
    },
  });
});

export const getSumUnPaidLoan = catchAsync(async (req, res, next) => {
  const sum = await Loan.sum("balance", {
    where: {
      [Op.and]: [
        { [Op.not]: [{ balance: 0 }] },
        { [Op.or]: [{ status: "unpaid" }, { status: "unfinished" }] },
      ],
    },
  });

  res.status(200).json({
    status: "success",
    data: {
      sum,
    },
  });
});
