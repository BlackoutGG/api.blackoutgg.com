"use strict";
const User = require("./models/User");
const pick = require("lodash/pick");
const sanitize = require("sanitize-html");
const guard = require("express-jwt-permissions")();
const { body, param } = require("express-validator");
const { validate } = require("$util");
const { transaction } = require("objection");

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

const updatePersonalInfo = async function (req, res, next) {
  const body = pick(req.body, [
    "username",
    "first_name",
    "last_name",
    "location",
    "gender",
    "description",
    "birthday",
  ]);

  const trx = await User.startTransaction();

  try {
    const user = await User.query()
      .patch(req.body)
      .where("id", req.user.id)
      .first()
      .throwIfNotFound()
      .returning(["id", ...Object.keys(body)]);

    await trx.commit();
    res.status(200).send(user);
  } catch (err) {
    console.log(err);
    await trx.rollback();
    next(err);
  }
};

module.exports = {
  path: "/update",
  method: "PATCH",
  middleware,
  handler: updatePersonalInfo,
};
