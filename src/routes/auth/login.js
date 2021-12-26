"use strict";
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("$models/User");
const UserSession = require("$models/UserSession");
const verifyRecaptcha = require("$services/recaptcha")(
  process.env.RECAPTCHA_SECRET
);
const redis = require("$services/redis");
const sanitize = require("sanitize-html");
const generateTokenData = require("$util/generateTokenData");
const { validate } = require("$util");
const { body, header } = require("express-validator");

const validators = validate([
  header("Authorization").isEmpty(),
  body("email")
    .notEmpty()
    .isEmail()
    .trim()
    .escape()
    .customSanitizer((v) => sanitize(v)),
  body("password")
    .notEmpty()
    .trim()
    .escape()
    .customSanitizer((v) => sanitize(v)),
  body("gresponse")
    .notEmpty()
    .customSanitizer((v) => sanitize(v)),
]);

const select = ["id", "discord_id", "username", "avatar", "password"];

const login = async function (req, res, next) {
  let attempts = 0;

  const user = await User.query()
    .where({ email: req.body.email, active: true })
    .select(select)
    .withGraphFetched("[roles.policies, policies]")
    .throwIfNotFound()
    .first();

  if (!user) {
    return res
      .status(422)
      .send({ message: "User doesn't exist or has not been activated." });
  }

  const key = `l_user:${user.id}`;
  const keyExists = await redis.get(key);

  if (user && keyExists) {
    attempts = JSON.parse(await redis.get(key));
    if (attempts === 5) {
      return res.status(400).send({
        message:
          "Due to multiple failed login attempts your account is been temporary locked for 24 hours. Reset your password to re-enable your account.",
      });
    }
  }

  const match = await bcrypt.compare(req.body.password, user.password);

  if (!match) {
    if (attempts !== 5 && keyExists) {
      await redis.set(key, attempts + 1, "NX", "KEEPTTL");
    } else {
      await redis.set(key, attempts + 1, "NX", "EX", 60 * 60 * 24);
    }

    return res.status(422).send({
      message: `Login failed. You have ${
        5 - attempts
      } more attempts before your account is disabled.`,
    });
  }

  const tokenData = generateTokenData(user);

  const access_token = jwt.sign(tokenData, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TOKEN_DURATION,
  });

  const refresh_token = jwt.sign(
    { jti: tokenData.refresh_jti, id: tokenData.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_TOKEN_DURATION }
  );

  await UserSession.createSession(user, tokenData);

  await redis.del(key);

  res.status(200).send({ access_token, refresh_token });
};

module.exports = {
  path: "/login",
  method: "POST",
  middleware: [
    (req, res, next) => {
      console.log(req.body);
      next();
    },
    validators,
    verifyRecaptcha,
  ],
  handler: login,
};
