"use strict";
const Form = require("./models/Form");
const Category = require("$models/Category");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { buildQuery, validate } = require("$util");

const select = [
  "forms.id",
  "forms.name",
  "forms.status",
  "forms.created_at",
  "forms.updated_at",
  "category.id as category_id",
];

const getAllFormTemplates = async function (req, res, next) {
  const filters = req.query.filters ? JSON.parse(req.query.filters) : null;
  let query = Form.query().joinRelated("category").select(select);

  if (filters && Object.keys(filters).length) {
    if (filters.category_id) {
      query = query.whereIn("category.id", filters.category_id);
    }

    if (filters.status) {
      query = query.where("status", filters.status);
    }
  }

  try {
    const [forms, categories] = await Promise.all([
      buildQuery(query, req.query.page, req.query.limit, null, null, filters),
      req.query.categories
        ? Category.query().select("id", "name")
        : Promise.resolve(null),
    ]);

    console.log(forms);

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
    guard.check(["view:forms"]),
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
