"use strict";
const Form = require("../models/Form");
const Category = require("$models/Category");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { buildQuery, validate } = require("$util");

const getAllForms = async function (req, res, next) {
  const filters = req.query.filters ? JSON.parse(req.query.filters) : null;
  const query = Form.query().withGraphFetched("category(selectBanner)");
  try {
    const [forms, categories] = await Promise.all([
      buildQuery(query, req.query.page, req.query.limit, null, null, filters),
      Category.query().select("id", "name"),
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
    guard.check("view:forms"),
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
