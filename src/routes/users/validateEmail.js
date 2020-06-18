"use strict";
const User = require("./models/User");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { validate } = require("$util");

const validateEmail = async function (req, res, next) {
  try {
    const user = await User.query()
      .where("email", req.query.value)
      .select("id")
      .first();
    if (user) return res.status(422).send("Email already in use.");
    res.status(200).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/validate/email",
  method: "GET",
  middleware: [
    validate([
      query("value")
        .notEmpty()
        .isEmail()
        .escape()
        .trim()
        .withMessage("Email is not valid."),
    ]),
  ],
  handler: validateEmail,
};
