import * as GenRandomVal from "./GenRandomVal.js";

const secretLength = 12;
const smallMinLength = 5;
const smallMaxLength = 30;

const bigMinLength = 12;
const bigMaxLength = 100;

/**
 * Generate random valid user
 * @returns {Object} user
 */
export const GenRandomValidUser = () => {
  let user = {};
  user.firstname = GenRandomVal.GenRandomValidString(smallMaxLength);
  user.lastname = GenRandomVal.GenRandomValidString(smallMaxLength);
  user.gender = GenRandomVal.GenRandomValidGender();
  user.identity = GenRandomVal.GenRandomValidIDNumber();
  user.contact = GenRandomVal.GenRandomValidContact("+237");
  user.email = GenRandomVal.GenRandomValidEmail();
  user.address = GenRandomVal.GenRandomValidText(bigMaxLength);
  user.photo = GenRandomVal.GenRandomValidPhoto();
  user.role = GenRandomVal.GenRandomValidRole();
  user.rights = GenRandomVal.GenRandomValidRights();
  return user;
};

/**
 * Generate random valid user
 * @returns {Object} user
 */
export const GenRandomValidUserWithPassword = () => {
  let password = GenRandomVal.GenRandomValidString(secretLength);
  const user = GenRandomValidUser();
  Object.assign(user, { password, passwordConfirm: password });
  return user;
};

/**
 * Generate valid users
 * @param {Number} max -> Maximum number of user to be generated
 * @returns {Array} users -> Generated users
 */
export const GenRandValidUsers = (max) => {
  let users = [];
  for (var i = 0; i < max; i++) {
    users.push(GenRandomValidUser());
  }
  return users;
};

export const GenRandomValidUserAccount = (userId) => {
  let account = {};
  account.name = GenRandomVal.GenRandomValidString(smallMaxLength);
  account.type = "user";
  account.balance = parseInt(GenRandomVal.GenRandomSmallAmount(), 10);
  account.user = parseInt(userId, 10);
  return account;
};

/**
 * Generate random valid zone, and assign user to that zone
 * @param {Number} userId  -> user id
 * @returns zone
 */
export const GenRandomValidZone = (userId) => {
  let zone = {};
  zone.name = GenRandomVal.GenRandomValidString(smallMaxLength);
  zone.description = GenRandomVal.GenRandomValidText(bigMaxLength);
  zone.longitude = GenRandomVal.GenRandomIntegerInRange(-90, 90);
  zone.latitude = GenRandomVal.GenRandomIntegerInRange(-180, 180);
  zone.user = userId;
  return zone;
};

/**
 * Generate maximum number of zones
 * @param {Number} max  -> Maximum number of zones to be generated
 * @param {Array} userIds  -> Array of user ids
 * @returns zones
 */
export const GenRandomValidZones = (max, userIds) => {
  let zones = [];
  for (var i = 0; i < max; i++) {
    zones.push(
      GenRandomValidZone(GenRandomVal.GenRandomSingleItemFromArray(userIds))
    );
  }
  return zones;
};

/**
 * Generate a random valid customer
 * @param {Number} zoneId -> Customer zone ID
 * @returns customer
 */
export const GenRandomValidCustomer = (zoneId) => {
  let customer = {};
  customer.firstname = GenRandomVal.GenRandomValidString(smallMaxLength);
  customer.lastname = GenRandomVal.GenRandomValidString(smallMaxLength);
  customer.gender = GenRandomVal.GenRandomValidGender();
  customer.identity = GenRandomVal.GenRandomValidIDNumber();
  customer.contact = GenRandomVal.GenRandomValidContact("+237");
  customer.email = GenRandomVal.GenRandomValidEmail();
  customer.address = GenRandomVal.GenRandomValidText(bigMaxLength);
  //customer.photo = GenRandomVal.GenRandomValidPhoto();
  customer.zone = zoneId;
  return customer;
};

export const GenRandomValidCustomerAccount = (customerId) => {
  let account = {};
  account.name = GenRandomVal.GenRandomValidString(smallMaxLength);
  account.type = "customer";
  account.balance = parseInt(GenRandomVal.GenRandomBigAmount(), 10);
  account.customer = parseInt(customerId, 10);
  return account;
};

export const GenRandomValidCustomerAccounts = (max, customerIds) => {
  let accounts = [];
  for (var i = 0; i < max; i++) {
    accounts.push(
      GenRandomValidCustomerAccount(
        GenRandomVal.GenRandomSingleItemFromArray(customerIds)
      )
    );
  }
  return accounts;
};

/**
 * Generate random valid customers
 * @param {Number} max -> maximum number of customers to be generated
 * @param {Array} zoneIds -> customers zone IDs
 * @returns customers
 */
export const GenRandomValidCustomers = (max, zoneIds) => {
  let customers = [];
  for (var i = 0; i < max; i++) {
    customers.push(
      GenRandomValidCustomer(GenRandomVal.GenRandomSingleItemFromArray(zoneIds))
    );
  }
  return customers;
};

export const GenRandomValidSource = (zoneId) => {
  let source = {};
  source.amount = GenRandomVal.GenRandomSmallAmount();
  source.zone = zoneId;
  return source;
};

export const GenRandomValidSources = (max, zoneIds) => {
  let sources = [];
  for (var i = 0; i < max; i++) {
    sources.push(
      GenRandomValidSource(GenRandomVal.GenRandomSingleItemFromArray(zoneIds))
    );
  }
  return sources;
};

/**
 * Generate random valid loan
 * @param {String} customerId
 * @returns {Object} loan
 */
export const GenRandomValidLoan = (customerId) => {
  let loan = {};
  loan.amount = GenRandomVal.GenRandomSmallAmount();
  // this should be generate random float
  //loan.interestRate = GenRandomVal.GenRandomIntegerInRange(0.1, 0.9);
  loan.customer = customerId;
  return loan;
};

/**
 * Generate random valid array of loans
 * @param {Array} customerIds
 * @returns {Array} loans
 */
export const GenRandomValidLoans = (customerIds) => {
  let loans = [];
  for (var i = 0; i < max; i++) {
    loans.push(GenRandomVal.GenRandomSingleItemFromArray(customerIds));
  }
  return loans;
};
