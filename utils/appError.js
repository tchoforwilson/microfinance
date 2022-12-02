/**
 *Define a custom error to be displayed on user screen, or log on server console
 * if statusCode start with 4, then it is user manipulation error ans the response
 * is sent back to the user, else it is an application error and the response is
 * log to the console
 */
export default class AppError extends Error {
  /**
   * Parameterized constructor for application error
   * @param {String} message
   * @param {Number} statusCode
   */
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
