"use strict";
const Category = require("./models/Category");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { validate } = require("$util");

const getAllCategories = async function (req, res, next) {
  try {
    const categories = await Category.query();
    res.status(200).send({ categories });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "GET",
  handler: getAllCategories,
};
