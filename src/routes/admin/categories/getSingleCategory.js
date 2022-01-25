"use strict";
const Category = require("$models/Category");
const guard = require("express-jwt-permissions")();
const { param } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, VIEW_ALL_CATEGORIES } = require("$util/policies");

const columns = ["id", "name", "image", "enable_recruitment"];

const getSingleCategory = async function (req, res) {
  const category = await Category.query()
    .where("id", req.params.id)
    .throwIfNotFound()
    .select(columns)
    .first();

  res.status(200).send(category);
};

module.exports = {
  path: "/:id",
  method: "GET",
  middleware: [
    guard.check([VIEW_ALL_ADMIN, VIEW_ALL_CATEGORIES]),
    validate([param("id").isNumeric().toInt(10)]),
  ],
  handler: getSingleCategory,
};
