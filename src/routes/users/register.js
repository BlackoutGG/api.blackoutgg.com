"use strict";
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 12;

const User = require("./models/User");
const UserRole = require("./models/UserRole");

const { body, header } = require("express-validator");
const { validate } = require("$util");

const register = async function (req, res) {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashed = await bcrypt.hash(req.body.password, salt);

    const query = await User.transaction(async (trx) => {
      const user = await User.query(trx)
        .insert({
          username: req.body.username,
          password: hashed,
        })
        .returning(["id", "username"]);

      const role = await UserRole.query(trx)
        .insert({ user_id: user.id, role_id: 2 })
        .returning("user_id");

      return user;
    });

    res.status(200).send({ success: true, user: query.username });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/register",
  method: "POST",
  middleware: [
    validate([
      header("Authorization").isEmpty(),
      body("username")
        .notEmpty()
        .isAlphanumeric()
        .isLength({ min: 3, max: 30 })
        .trim()
        .escape(),
      body("password").notEmpty().isLength({ min: 8, max: 50 }).trim().escape(),
    ]),
  ],
  handler: register,
};
