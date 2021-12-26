"use strict";
const User = require("$models/User");
const pick = require("lodash/pick");
const sanitize = require("sanitize-html");
const redis = require("$services/redis");
const guard = require("express-jwt-permissions")();
const { body, param } = require("express-validator");
const { validate } = require("$util");
const { transaction } = require("objection");

const middleware = [
  validate([
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
    body("avatar")
      .optional()
      .notEmpty()
      .isString()
      .trim()
      .customSanitizer((v) => sanitize(v)),
  ]),
];

const updatePersonalInfo = async function (req, res, next) {
  const body = pick(req.body, [
    "first_name",
    "last_name",
    "location",
    "gender",
    "description",
    "birthday",
    "avatar",
  ]);

  const user = await User.query()
    .patch(body)
    .where("id", req.user.id)
    .first()
    .throwIfNotFound()
    .returning(["id", ...Object.keys(body)]);

  await redis.del(`me_${req.user.id}`);

  res.status(200).send(user);
};

module.exports = {
  path: "/update",
  method: "PATCH",
  middleware,
  handler: updatePersonalInfo,
};
