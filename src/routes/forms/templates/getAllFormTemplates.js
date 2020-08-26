"use strict";
const Form = require("../models/Form");
const Category = require("$models/Category");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { buildQuery, validate } = require("$util");

const getAllForms = async function (req, res, next) {
  try {
    const [forms, categories] = await Promise.all([
      buildQuery.call(
        Form.query().withGraphFetched("category(selectBanner)"),
        req.query.page,
        req.query.limit
      ),
      req.query.getCategories ? Category.query() : Promise.resolve(null),
    ]);

    console.log(forms);

    res.status(200).send({ forms, categories });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [
    guard.check("users:view"),
    validate([
      query("page").isNumeric(),
      query("limit").isNumeric(),
      query("getCategories").isBoolean(),
    ]),
  ],
  handler: getAllForms,
};
