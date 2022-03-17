import jwt from "jsonwebtoken";
/**
 * Generate a sign token
 * @param {String} id -> Token payload
 * @returns Object
 */
export const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
