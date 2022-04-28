"use strict";
import database from "../config/database.js";
const Op = database.Sequelize.Op;
/**
 * @description Class to implement filtering, sorting, limits and pagination
 * for all input queries
 */
export default class APIFeatures {
  /**
   * Constructor
   * @param {Object} query  -> Model object
   * @param {String} queryString  -> Query String
   */
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;

    this.queryStr = "";
    this.order = [];
    this.attributes = [];
    this.offset = 0;
    this.limit = 0;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "order", "limit", "attributes"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) Advanced filtering
    this.queryStr = JSON.stringify(queryObj);
    this.queryStr = this.queryStr.replace(
      /\b(and|or|gte|gt|lte|lt|ne|eq|between)\b/g,
      (match) => `[Op.${match}]`
    );
    this.queryStr = this.queryStr.replace("$", "");
    return this;
  }

  ordered() {
    if (this.queryString.order) {
      const orderBy = this.queryString.order.split(",");
      orderBy.forEach((el) => this.order.push([`${el}`, "DESC"]));
    } else {
      this.order.push(["createdAt", "DESC"]);
    }
    return this;
  }

  limitAttributes() {
    if (this.queryString.attributes) {
      const attributed = this.queryString.attributes.split(",");
      attributed.forEach((el) => this.attributes.push(`${el}`));
    } else {
      this.attributes = {
        exclude: [
          "password",
          "passwordConfirm",
          "active",
          "passwordChangedAt",
          "updatedAt",
        ],
      };
    }

    return this;
  }

  liked() {
    if (this.queryString.name) {
      const condition = { [Op.iRegexp]: `${this.queryString.name}` };
      this.queryStr = JSON.parse(this.queryStr);
      this.queryStr["name"] = condition;
    } else {
      this.queryStr = {};
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const offset = (page - 1) * limit;

    this.query = this.query.findAndCountAll({
      where: this.queryStr,
      order: this.order,
      attributes: this.attributes,
      limit,
      offset,
    });

    return this;
  }
}
