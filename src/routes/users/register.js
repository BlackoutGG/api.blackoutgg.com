"use strict";
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 12;

const User = require("./models/User");

const { body, header } = require("express-validator");
const { validate } = require("$util");

const insertFn = (creds) => {
  return {
    "#id": "newUser",
    ...creds,
    user_roles: [
      {
        role_id: 3,
      },
    ],
  };
};

const register = async function (req, res, next) {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashed = await bcrypt.hash(req.body.password, salt);

    const creds = {
      username: req.body.username,
      email: req.body.email,
      password: hashed,
    };

    const user = await User.transaction(async (trx) => {
      const result = await User.query(trx)
        .insertGraph(insertFn(creds, { relate: true }))
        .returning("*");

      return result.username;
    });

    res.status(200).send({ user });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/register",
  method: "POST",
  middleware: [
    (req, res, next) => {
      console.log(req.body, req.headers);
      next();
    },
    validate([
      header("Authorization").isEmpty(),
      body("username")
        .notEmpty()
        .isAlphanumeric()
        .isLength({ min: 3, max: 30 })
        .trim()
        .escape(),
      body("email").notEmpty().isEmail(),
      body("password").notEmpty().isLength({ min: 8, max: 50 }).trim().escape(),
    ]),
  ],
  handler: register,
};
