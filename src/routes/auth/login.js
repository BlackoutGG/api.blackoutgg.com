"use strict";
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("$models/User");
const verifyRecaptcha = require("$services/recaptcha")(
  process.env.RECAPTCHA_SECRET
);
const { validate, generateScope } = require("$util");
const { body, header } = require("express-validator");
const createError = require("http-errors");

const consoleLogout = (req, res, next) => {
  console.log(req.body);
  next();
};

const login = async function (req, res, next) {
  try {
    const user = await User.query()
      .where({ email: req.body.email, is_disabled: false })
      .select("id", "username", "password")
      .withGraphFetched("roles")
      .first()
      .throwIfNotFound();

    const match = await bcrypt.compare(req.body.password, user.password);

    if (!match) {
      return next(new createError.BadRequest("User credentials do not match."));
    }

    const data = {
      id: user.id,
      username: user.username,
      roles: user.getRoles(),
      permissions: user.getScope(),
    };

    console.log(data.permissions);

    const token = jwt.sign(data, process.env.JWT_SECRET, {
      expiresIn: "5h",
    });

    res.status(200).send({ token });
  } catch (err) {
    // if (err.name === "NotFoundError") {
    //   return next(new createError.NotFound("User account doesn't exist."));
    // }
    next(err);
  }
};

module.exports = {
  path: "/login",
  method: "POST",
  middleware: [
    validate([
      header("Authorization").isEmpty(),
      body("email").notEmpty().isEmail().trim().escape(),
      body("password").notEmpty().trim().escape(),
      body("gresponse").notEmpty(),
    ]),
    verifyRecaptcha,
  ],
  handler: login,
};
