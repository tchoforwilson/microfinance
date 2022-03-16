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
  user.identity_number = GenRandomVal.GenRandomValidIDNumber();
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
  Object.assign(user, { password, password_confirm: password });
  return user;
};

/**
 * Generate valid users
 * @param {Number} max -> Maximum number of user to be generated
 * @param {Array} addressIds -> address ids
 * @param {Array} accountIds -> account ids
 * @returns {Array} users -> Generated users
 */
export const GenRandValidUsers = (max) => {
  let users = [];
  for (var i = 0; i < max; i++) {
    users.push(GenRandomValidUser());
  }
  return users;
};

export const GenRandomValidUserAccount = (userId, type = "user") => {
  let account = {};
  account.account_name = GenRandomVal.GenRandomValidString(smallMaxLength);
  account.type = type;
  account.balance = parseInt(GenRandomVal.GenRandomSmallAmount(), 10);
  account.user_id = parseInt(userId, 10);
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
  zone.description = GenRandomVal.GenRandomInValidText(bigMaxLength);
  zone.longitude = GenRandomVal.GenRandomIntegerInRange(-90, 90);
  zone.latitude = GenRandomVal.GenRandomIntegerInRange(-180, 180);
  zone.user_id = userId;
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
    zones.push(GenRandomValidZone(userIds[i]));
  }
  return zones;
};

/**
 * Generate a random valid customer
 * @param {Number} addressId -> customer addres ID
 * @param {Number} zoneId -> Customer zone ID
 * @returns customer
 */
export const GenRandomValidCustomer = (addressId, zoneId) => {
  let customer = {};
  customer.firstname = GenRandomVal.GenRandomValidString(smallMaxLength);
  customer.lastname = GenRandomVal.GenRandomValidString(smallMaxLength);
  customer.identity_number = GenRandomVal.GenRandomValidIDNumber();
  customer.contact = GenRandomVal.GenRandomValidContact("+237");
  customer.email = GenRandomVal.GenRandomInValidEmail();
  //customer.photo = GenRandomVal.GenRandomValidPhoto();
  //customer.rights = GenRandomVal.GenRandomValidRights();
  customer.address_id = addressId;
  customer.zone_id = zoneId;
  return customer;
};

/**
 * Generate random valid customers
 * @param {Number} max -> maximum number of customers to be generated
 * @param {Array} addressIds  -> Customers addressIds
 * @param {Array} zoneIds -> customers zone IDs
 * @returns customers
 */
export const GenRandomValidCustomers = (max, addressIds, zoneIds) => {
  let customers = [];
  for (var i = 0; i < max; i++) {
    customers.push(GenRandomValidCustomer(addressIds[i], zoneIds[i]));
  }
  return customers;
};

export const GenRandomValidSource = (zoneId) => {
  let source = {};
  source.amount = GenRandomVal.GenRandomBigAmount();
  source.zone_id = zoneId;
  return source;
};

export const GenRandomValidSourcesAmount = (max, zoneIds) => {
  let sources = {};
  for (var i = 0; i < max; i++) {
    GenRandomValidSource(zoneIds[i]);
  }
  return sources;
};
