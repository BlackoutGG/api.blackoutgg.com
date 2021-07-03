"use strict";
const jwt = require("jsonwebtoken");
const uniq = require("lodash.uniq");
const bcrypt = require("bcrypt");
const User = require("$models/User");
const UserSession = require("$models/UserSession");
const verifyRecaptcha = require("$services/recaptcha")(
  process.env.RECAPTCHA_SECRET
);
const sanitize = require("sanitize-html");
const addHours = require("date-fns/addHours");
const { nanoid } = require("nanoid");
const { validate } = require("$util");
const { body, header } = require("express-validator");

const consoleLogout = (req, res, next) => {
  console.log(req.body);
  next();
};

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
  body("gresponse").notEmpty(),
]);

const login = async function (req, res, next) {
  let attempts = 0;

  const user = await User.query()
    .where({ email: req.body.email })
    .select("id", "username", "avatar", "password")
    .withGraphFetched("[roles.policies, policies]")
    .first();

  if (!user) {
    return res
      .status(422)
      .send({ message: "User doesn't exist or has not been activated." });
  }

  const key = `l_user:${user.id}`;
  const keyExists = await req.redis.exists(key);

  if (user && keyExists) {
    attempts = JSON.parse(await req.redis.get(key));
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
      await req.redis.set(key, attempts + 1, "NX", "KEEPTTL");
    } else {
      await req.redis.set(key, attempts + 1, "NX", "EX", 60 * 60 * 24);
    }

    return res.status(422).send({
      message: `Login failed. You have ${
        5 - attempts
      } more attempts before your account is disabled.`,
    });
  }

  const rolePolicies = user.roles.flatMap(({ policies }) =>
    policies.map(({ action, target, resource }) => {
      return `${action}:${target}:${resource}`;
    })
  );

  const userPolicies = user.policies.map(
    ({ action, target, resource }) => `${action}:${target}:${resource}`
  );

  const permissions = uniq([...userPolicies, ...rolePolicies]);

  const level = Math.min(user.roles.map(({ level }) => level));

  const access_jti = nanoid();
  const refresh_jti = nanoid();
  const expires = addHours(new Date(), 1);

  const data = {
    jti: access_jti,
    refresh_jti,
    id: user.id,
    username: user.username,
    roles: user.roles.map(({ name }) => name),
    level,
    permissions,
  };

  const access_token = jwt.sign(data, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TOKEN_DURATION,
  });

  const refresh_token = jwt.sign(
    { jti: refresh_jti, id: data.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_TOKEN_DURATION }
  );

  await UserSession.query().insert({
    token_id: access_jti,
    refresh_token_id: refresh_jti,
    user_id: user.id,
    expires,
  });

  await req.redis.del(key);

  res.status(200).send({ access_token, refresh_token });
};

module.exports = {
  path: "/login",
  method: "POST",
  middleware: [validators, verifyRecaptcha],
  handler: login,
};
