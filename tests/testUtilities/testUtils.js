import jwt from "jsonwebtoken";
import { GenRandomValidUserWithPassword } from "./../testUtilities/unit_testbases.js";
import database from "./../../config/database.js";

const User = database.user;
/**
 * Generate a sign token
 * @param {String} id -> Token payload
 * @returns Object
 */
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

/**
 * Create a new admin user in the database, this admin user can either be of role
 * manager or accountant
 * @param {String} role
 * @returns {Object} User
 */
export const createAdminUser = async (role) => {
  const user = GenRandomValidUserWithPassword();
  user.password = "pass1234";
  user.passwordConfirm = "pass1234";
  user.role = role;
  user.rights.push(
    "createZone",
    "getZones",
    "getZone",
    "updateZone",
    "deleteZone"
  );
  return await User.create(user);
};

/**
 * Generate a new request header token, set the authorization to Bearer.
 * This header token is generated from the user id
 * @param {Object} user
 * @returns {String} token
 */
export const getHeader = (user) => {
  const token = signToken(user.id);
  return "Bearer " + token;
};
