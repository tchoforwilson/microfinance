"use strict";
import AppError from "./../utils/appError.js";
import catchAsync from "./../utils/catchAsync.js";
import database from "./../config/database.js";

const Loan = database.loan;
const Customer = database.customer;

export const createLoan = catchAsync(async (req, res, next) => {
  // 1. Get data
  const { amount, interestRate, customer_id } = req.body;
  // 2. Check if customer exist and is active
  const customer = await Customer.findByPk(parseInt(customer_id));
  if (!customer.active) {
    return next(new AppError("Customer inactive!", 404));
  }
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
  loanData = loan.dataValues;

  // send response
  res.status(200).json({
    status: "success",
    data: {
      loan: loanData,
      customer,
    },
  });
});
