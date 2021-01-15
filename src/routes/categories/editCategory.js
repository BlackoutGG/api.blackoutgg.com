"use strict";
const Category = require("./models/Category");
const guard = require("express-jwt-permissions")();
const { body, param } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  body("details.name").optional().isString().escape().trim(),
  body("details.recruitment").optional().isBoolean(),
  param("id").isNumeric().toInt(10),
]);

const editCategory = async function (req, res, next) {
  const category = await Category.query()
    .patch(req.body.details)
    .where("id", req.params.id)
    .first()
    .returning("id", "name");
  res.status(200).send({ category });
};

module.exports = {
  path: "/:id",
  method: "PUT",
  middleware: [guard.check("view:admin"), validators],
  handler: editCategory,
};
