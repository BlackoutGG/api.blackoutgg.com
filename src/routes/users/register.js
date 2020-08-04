"use strict";
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 12;

const User = require("./models/User");

const { body, header } = require("express-validator");
const { validate } = require("$util");

const insertFn = (creds) => {
  return {
    "#id": "newUser",
    username: req.body.username,
    email: req.body.email,
    password: hashed,
    user_roles: [
      {
        user_id: `#{refnewUser.id}`,
        role_id: 2,
      },
    ],
  };
};

const register = async function (req, res, next) {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashed = await bcrypt.hash(req.body.password, salt);

    // const user = await User.query()
    //   .insertGraph(
    //     [
    //       {
    //         "#id": "newUser",
    //         username: req.body.username,
    //         email: req.body.email,
    //         password: hashed,
    //         user_roles: [
    //           {
    //             user_id: `#{refnewUser.id}`,
    //             role_id: 2,
    //           },
    //         ],
    //       },
    //     ],
    //     { allowRefs: true }
    //   )
    //   .returning("*");

    const creds = {
      username: req.body.username,
      email: req.body.email,
      password: hashed,
    };

    const user = await User.query().insertGraph(
      insertFn(creds, { allowRefs: true })
    );

    console.log(user);

    res.status(200).send({ success: true, username: user.username });
  } catch (err) {
    console.log(err);
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
