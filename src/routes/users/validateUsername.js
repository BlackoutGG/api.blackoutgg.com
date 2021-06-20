"use strict";
const User = require("./models/User");
const guard = require("express-jwt-permissions")();
const sanitize = require("sanitize-html");
const { query } = require("express-validator");
const { validate } = require("$util");

const validateUsername = async function (req, res, next) {
  const user = await User.query()
    .where("username", req.query.value)
    .select("id")
    .first();
  if (user) return res.status(422).send("Username already exists.");
  res.status(200).send();
};

module.exports = {
  path: "/validate/username",
  method: "GET",
  middleware: [
    validate(
      [
        query("value")
          .notEmpty()
          .isString()
          .withMessage("Username must be alphanumeric.")
          .isLength({ min: 3, max: 30 })
          .withMessage("Username must be 3 to 30 in length.")
          .escape()
          .trim()
          .customSanitizer((v) => sanitize(v)),
      ],
      422
    ),
  ],
  handler: validateUsername,
};
