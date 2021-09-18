"use strict";
const Category = require("$models/Category");
const guard = require("express-jwt-permissions")();
const sanitize = require("sanitize-html");
const { query } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN } = require("$util/policies");

const validateCategoryName = async function (req, res, next) {
  const category = await Category.query()
    .where("name", req.query.value)
    .first();
  if (category) return res.status(422).send("name already exists.");
  res.status(200).send();
};

module.exports = {
  path: "/categories",
  method: "GET",
  middleware: [
    guard.check([VIEW_ALL_ADMIN]),
    validate([
      query("value")
        .notEmpty()
        .isAlphanumeric()
        .withMessage("Category name must be alphanumeric.")
        .isLength({ min: 3, max: 30 })
        .withMessage("Category name must be 3 to 30 in length.")
        .escape()
        .trim()
        .customSanitizer((v) => sanitize(v)),
    ]),
  ],
  handler: validateCategoryName,
};
