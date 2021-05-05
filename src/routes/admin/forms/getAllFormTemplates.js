"use strict";
const Form = require("./models/Form");
const Category = require("$models/Category");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { buildQuery, validate } = require("$util");
const { VIEW_ALL_ADMIN, VIEW_ALL_FORMS } = require("$util/permissions");

const getAllFormTemplates = async function (req, res, next) {
  const filters = req.query.filters || null;
  const query = Form.query();

  const [forms, categories] = await Promise.all([
    buildQuery(query, req.query.page, req.query.limit, null, null, filters),
    req.query.categories
      ? Category.query().select("id", "name")
      : Promise.resolve(null),
  ]);

  res.status(200).send({ forms, categories });
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [
    guard.check([VIEW_ALL_ADMIN, VIEW_ALL_FORMS]),
    validate([
      query("page").optional().isNumeric(),
      query("limit").optional().isNumeric(),
      query("orderBy").optional().isAlphanumeric(),
      query("sortBy").optional().isAlphanumeric(),
      query("filters").optional(),
      query("categories").optional().isBoolean(),
    ]),
  ],
  handler: getAllFormTemplates,
};
