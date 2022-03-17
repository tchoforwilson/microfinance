import randomstring from "randomstring";
import randomItem from "random-item";
import randomInteger from "random-int";

const CONST_ONE = 1;
const CONST_TWO = 2;
const CONST_TWELVE = 12;

const smallMinAmount = 1000;
const smallMaxAmount = 100000;

const bigMinAmount = 500000;
const bigMaxAmount = 5000000;

const roles = ["accountant", "collector"];
const rights = ["CloseSession", "OpenSession", "CreateZone"];

export const GenRandomInteger = (max) => {
  return randomInteger(max);
};

export const GenRandomBoolean = () => {
  if (GenRandomInteger(CONST_ONE) === 1) return true;
  else return false;
};

export const GenRandomIntegerInRange = (min, max) => {
  return randomInteger(min, max);
};

export const GenRandomIntegerOutOfRange = (min, max) => {};

export const GenRandomValidString = (len) => {
  const str = randomstring.generate({
    length: len,
    charset: "alphabetic",
    capitalization: "lowercase",
  });
  return str;
};
export const GenRandomInValidString = (len) => {
  const str = randomstring.generate({
    length: len,
    charset: "numeric",
    capitalization: "lowercase",
  });
  return str;
};

export const GenRandomValidText = (len) => {
  const str = randomstring.generate({
    length: len,
    charset: "alphanumeric",
  });
  return str;
};

export const GenRandomInValidText = (len) => {};

export const GenRandomSingleItemFromArray = (arr) => {
  return randomItem(arr);
};

export const GenRandomMultipleItemFromArray = (len, arr) => {
  return randomItem.multiple(arr, len);
};

export const GenRandomValidIDNumber = () => {
  return randomstring.generate({
    length: 9,
    charset: "numeric",
  });
};

export const GenRandomInValidIDNumber = () => {
  const len = randomInteger.generate(CONST_ONE, CONST_TWELVE);
  return randomstring.generate({
    length: len,
    charset: "numeric",
  });
};

export const GenRandomValidContact = (code) => {
  let str = randomstring.generate({
    length: 9,
    charset: "numeric",
  });
  return code + str;
};

export const GenRandomInValidContact = (code) => {
  let len = randomInteger.generate(CONST_ONE, CONST_TWELVE);
  let str = randomstring.generate({
    length: len,
    charset: "numeric",
  });
  return code + str;
};

export const GenRandomValidEmail = () => {
  const exts = [".org", ".com", ".net"];
  const types = ["@gmail", "@yahoo", "@hotmail"];
  const ext = GenRandomSingleItemFromArray(exts);
  const type = GenRandomSingleItemFromArray(types);
  const str = GenRandomValidString(GenRandomInteger(CONST_TWELVE));
  return str + type + ext;
};

export const GenRandomInValidEmail = () => {
  let str = GenRandomValidString(GenRandomInteger(12));
  if (GenRandomBoolean()) {
    const types = ["@gmail", "@yahoo", "@hotmail"];
    const type = GenRandomSingleItemFromArray(types);
    str += type;
  } else {
    const exts = [".org", ".com", ".net"];
    const ext = GenRandomSingleItemFromArray(exts);
    str += ext;
  }

  return str;
};

export const GenRandomValidPhoto = () => {
  const extensions = [".png", ".jpeg", ".jpg", ".gif"];
  const ext = GenRandomSingleItemFromArray(extensions);
  const str = GenRandomValidString(CONST_TWELVE);
  return str + ext;
};

export const GenRandomValidGender = () => {
  const genders = ["male", "female"];
  return GenRandomSingleItemFromArray(genders);
};

export const GenRandomInValidGender = () => {
  const genders = ["Unknown", "Invalid"];
  return GenRandomSingleItemFromArray(genders);
};

export const GenRandomValidRole = () => {
  return GenRandomSingleItemFromArray(roles);
};

export const GenRandomValidRights = () => {
  const len = GenRandomInteger(CONST_TWELVE);
  return GenRandomMultipleItemFromArray(len, rights);
};

export const GenRandomSmallAmount = () => {
  return GenRandomIntegerInRange(smallMinAmount, smallMaxAmount);
};

export const GenRandomBigAmount = () => {
  return GenRandomIntegerInRange(bigMinAmount, bigMaxAmount);
};
