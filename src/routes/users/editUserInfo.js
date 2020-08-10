"use strict";
const User = require("./models/User");
const pick = require("lodash/pick");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 12;
const guard = require("express-jwt-permissions")();
const { body, param } = require("express-validator");
const { validate } = require("$util");

const middleware = [
  guard.check("users:edit"),
  validate([
    param("id").isNumeric(),
    // body("type").notEmpty().isIn(["username", "email", "all"]),
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
  // const type = req.body.type,
  //   value = req.body[type],
  //   id = req.params.id;

  const patch = pick(req.body, ["username", "email", "avatar", "password"]),
    id = req.params.id;

  if (patch.password) {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashed = await bcrypt.hash(obj.password, salt);
    patch.password = hashed;
  }

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
