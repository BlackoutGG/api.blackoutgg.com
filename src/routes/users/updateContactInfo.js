"use strict";
const User = require("./models/User");
const bcrypt = require("bcrypt");
const sanitize = require("sanitize-html");
const guard = require("express-jwt-permissions")();
const { body, param } = require("express-validator");
const { validate } = require("$util");

const middleware = [
  validate([
    body("username")
      .optional()
      .notEmpty()
      .isAlphanumeric()
      .escape()
      .trim()
      .customSanitizer((v) => sanitize(v)),
    body("first_name")
      .optional()
      .notEmpty()
      .isAlphanumeric()
      .escape()
      .trim()
      .customSanitizer((v) => sanitize(v)),
    body("last_name")
      .optional()
      .notEmpty()
      .isAlphanumeric()
      .escape()
      .trim()
      .customSanitizer((v) => sanitize(v)),
    body("location")
      .optional()
      .notEmpty()
      .isAlphanumeric()
      .escape()
      .trim()
      .customSanitizer((v) => sanitize(v)),
    body("gender")
      .optional()
      .notEmpty()
      .isAlphanumeric()
      .escape()
      .trim()
      .customSanitizer((v) => sanitize(v)),
    body("description")
      .optional()
      .notEmpty()
      .isString()
      .escape()
      .trim()
      .customSanitizer((v) => sanitize(v)),
    body("birthday")
      .optional()
      .notEmpty()
      .isDate()
      .trim()
      .customSanitizer((v) => sanitize(v)),
  ]),
];

const updateContactInfo = async function (req, res, next) {
  const check = await User.query()
    .where("id", req.user.id)
    .first()
    .throwIfNotFound();

  if (!(await bcrypt.compare(req.body.password, check.password))) {
    return res.status(401).send("Invalid credentials.");
  }

  const user = await User.query()
    .where("id", req.user.id)
    .patch(req.body)
    .returning(["id", ...Object.keys(req.body)]);

  res.status(200).send(user);
};

module.exports = {
  path: "/update/contact",
  method: "PATCH",
  middleware,
  handler: updateContactInfo,
};
