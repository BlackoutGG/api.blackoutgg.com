"use strict";
const User = require("./models/User");
const pick = require("lodash/pick");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 12;
const guard = require("express-jwt-permissions")();
const { body, param } = require("express-validator");
const { validate } = require("$util");

const middleware = [
  guard.check("update:users"),
  validate([
    param("id").isNumeric(),
    body("username").optional().notEmpty().isAlphanumeric().escape().trim(),
    body("email")
      .optional()
      .notEmpty()
      .isEmail()
      .escape()
      .normalizeEmail()
      .trim(),
  ]),
];

const editUserInfo = async function (req, res, next) {
  const patch = pick(req.body, ["username", "email", "avatar"]),
    id = req.params.id;

  try {
    const user = await User.query()
      .patch(patch)
      .where("id", id)
      .first()
      .throwIfNotFound()
      .returning(["id", ...Object.keys(patch)]);

    res.status(200).send({ user });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/:id/edit",
  method: "PUT",
  middleware,
  handler: editUserInfo,
};
