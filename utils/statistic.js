import database from "../config/database.js";
const Op = database.Sequelize.Op;

/**
 * Get a beginning and end date of a query
 * @param {Number} year -> the year to get the date if not provided, used the current date year
 * @param {Number} month -> the month of the year if not provided, used the current month of the year
 * @return {Object} {startDate, endDate}
 */
export const getStartEndMonth = (
  year = new Date().getFullYear(),
  month = new Date().getMonth() + 1
) => {
  const startDate = year + "-" + month + "-" + "01";
  const endDate = year + "-" + month + "-" + "31";
  return { startDate, endDate };
};

/**
 * Sum the data of a particular column
 * @param {Object} Model  -> Model object i.e table
 * @param {String} column  -> Row to sum
 * @param {String} filter -> query string to consider for summation
 * @return {query}
 */
export const getSum = async (Model, column, filter) => {
  return await Model.sum(column, { where: filter });
};

/**
 * Count the number of items in a column, and filter
 * @param {Object} Model  -> Model object i.e table
 * @param {String} column  -> Row to sum
 * @param {String} filter -> query string to consider for summation
 * @return {query}
 */
export const getCount = async (Model, column, filter) => {
  return await Model.count(column, { where: filter });
};

/**
 * Get the the statistics for a particular month
 * @param {Object} Model  -> Model object i.e table
 * @param {Number} year -> The year to ge the statistics if not provided, used the current date year
 * @param {String} month  -> The month to get the statistics if not provided, used the current date
 * @return {query}
 */
export const getMonthlyStatics = async (
  Model,
  year = new Date().getFullYear(),
  month = new Date().getMonth() + 1
) => {
  const { startDate, endDate } = getStartEndMonth(year, month);
  return await Model.findAndCountAll({
    where: { date: { [Op.between]: [startDate, endDate] } },
  });
};
