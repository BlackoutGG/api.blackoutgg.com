"use strict";
const Category = require("./models/Category");
const guard = require("express-jwt-permissions")();
const { validate, buildQuery } = require("$util");

const getAllCategories = async function (req, res, next) {
  try {
    const categories = await buildQuery(
      Category.query(),
      req.query.page,
      req.query.limit
    );
    res.status(200).send({ categories });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "GET",
  handler: getAllCategories,
};
