"use strict";
const Category = require("./models/Category");
const guard = require("express-jwt-permissions")();
const sanitize = require("sanitize-html");
const { query } = require("express-validator");
const { validate } = require("$util");

const validateCategoryName = async function (req, res, next) {
  const role = await Category.query().where("name", req.query.value).first();
  if (role) return res.status(422).send("name already exists.");
  res.status(200).send();
};

module.exports = {
  path: "/validate/name",
  method: "GET",
  middleware: [
    guard.check("view:admin"),
    validate([
      query("value")
        .notEmpty()
        .isAlphanumeric()
        .withMessage("Name must be alphanumeric.")
        .isLength({ min: 3, max: 30 })
        .withMessage("Name must be 3 to 30 in length.")
        .escape()
        .trim()
        .customSanitizer((v) => sanitize(v)),
    ]),
  ],
  handler: validateCategoryName,
};
