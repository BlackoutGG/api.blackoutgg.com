"use strict";
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 12;
const sendEmail = require("$services/email");
const verifyRecaptcha = require("$services/recaptcha")(
  process.env.RECAPTCHA_SECRET
);
const redis = require("$services/redis");

const User = require("$models/User");
const Settings = require("$models/Settings");

const { body, header } = require("express-validator");
const { validate } = require("$util");
const { transaction } = require("objection");
const { nanoid } = require("nanoid");

const register = async function (req, res, next) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hashed = await bcrypt.hash(req.body.password, salt);

  const creds = {
    username: req.body.username,
    email: req.body.email,
    password: hashed,
    local: true,
  };

  const trx = await User.startTransaction();

  try {
    const [user, settings] = await Promise.all([
      User.createUser(creds, [{ id: 3 }], trx),
      Settings.query()
        .where("id", 1)
        .select("universal_request_ttl_in_minutes")
        .first(),
    ]);

    if (user) {
      const code = nanoid(32);

      const exp = settings.universal_request_ttl_in_minutes * 60;

      await redis.set(user.id, code, "NX", "EX", exp);

      await sendEmail(user.email, "USER_REGISTERATION", {
        url: process.env.BASE_URL + "activation",
        id: user.id,
        code,
      });
    }

    await trx.commit();

    res.status(200).send({ user });
  } catch (err) {
    await trx.rollback();
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
      body("gresponse").isString().escape().trim(),
    ]),
    verifyRecaptcha,
  ],
  handler: register,
};
