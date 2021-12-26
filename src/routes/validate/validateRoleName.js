"use strict";
const Roles = require("$models/Roles");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { validate } = require("$util");

const validateRoleName = async function (req, res, next) {
  const role = await Roles.query()
    .where("name", req.query.value)
    .select("id")
    .first();
  if (role) return res.status(422).send("name already exists.");
  res.status(200).send();
};

module.exports = {
  path: "/role",
  method: "GET",
  middleware: [
    guard.check(["view:roles", "update:roles"]),
    validate(
      [
        query("value")
          .notEmpty()
          .isAlphanumeric()
          .withMessage("Name must be alphanumeric.")
          .isLength({ min: 3, max: 30 })
          .withMessage("Name must be 3 to 30 in length.")
          .escape()
          .trim(),
      ],
      422
    ),
  ],
  handler: validateRoleName,
};
