"use strict";
const Form = require("../models/Form");
const Category = require("$models/Category");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { buildQuery, validate } = require("$util");

const getAllForms = async function (req, res, next) {
  const filters = req.query.filters ? JSON.parse(req.query.filters) : null;

  try {
    const [forms, categories] = await Promise.all([
      buildQuery.call(
        Form.query().withGraphFetched("category(selectBanner)"),
        req.query.page,
        req.query.limit,
        null,
        null,
        filters
      ),
      req.query.getCategories ? Category.query() : Promise.resolve(null),
    ]);

    res.status(200).send({ forms, categories });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [
    guard.check("users:view"),
    validate([
      query("page").optional().isNumeric(),
      query("limit").optional().isNumeric(),
      query("orderBy").optional().isAlphanumeric(),
      query("sortBy").optional().isAlphanumeric(),
      query("filters").optional(),
      query("getCategories").isBoolean(),
    ]),
  ],
  handler: getAllForms,
};
