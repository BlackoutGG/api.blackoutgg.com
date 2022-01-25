"use strict";
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("$models/User");
const UserSession = require("$models/UserSession");
const Settings = require("$models/Settings");
const Policies = require("$models/Policies");
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
  const {
    enable_user_authentication,
    number_of_login_attempts,
  } = await Settings.query()
    .select("enable_user_authentication", "number_of_login_attempts")
    .first();

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

  if (!enable_user_authentication) {
    const policy = await Policies.query()
      .where({ action: "view", target: "all", resource: "admin" })
      .select("id")
      .first();

    const policies = user.roles.reduce(
      (output, role) => {
        output = output.concat(role.policies);
        return output;
      },
      [...user.policies]
    );

    const hasAdminPrivs = policies.some(({ id }) => id === policy.id);

    /** IF view:all:admin policy can't be found we return a status of 401 */
    if (!hasAdminPrivs) {
      return res.sendStatus(401);
    }
  }

  const key = `login:user:${user.id}`;
  const userLoginAttempts = parseInt(await redis.get(key), 10) || 0;

  if (user && userLoginAttempts === 5) {
    return res.status(400).send({
      message:
        "Due to multiple failed login attempts your account is been temporary locked for 24 hours. Reset your password to re-enable your account.",
    });
  }

  const match = await bcrypt.compare(req.body.password, user.password);

  if (!match) {
    if (userLoginAttempts > 0 && userLoginAttempts !== 5) {
      await redis.set(key, userLoginAttempts + 1, "KEEPTTL");
    } else {
      await redis.set(key, userLoginAttempts + 1, "NX", "EX", 60 * 60 * 24);
    }

    return res.status(422).send({
      message: `Login failed. You have ${
        number_of_login_attempts - userLoginAttempts
      } more attempts before your account is disabled.`,
    });
  }

  let tokenData = generateTokenData(user);

  const access_token = jwt.sign(tokenData, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TOKEN_DURATION,
  });

  const refreshData = {
    jti: tokenData.refresh_jti,
    id: tokenData.id,
  };

  const refresh_token = jwt.sign(refreshData, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_TOKEN_DURATION,
  });

  await UserSession.createSession(user, tokenData);

  await redis.del(key);

  res.status(200).send({ access_token, refresh_token });
};

module.exports = {
  path: "/login",
  method: "POST",
  middleware: [validators, verifyRecaptcha],
  handler: login,
};
