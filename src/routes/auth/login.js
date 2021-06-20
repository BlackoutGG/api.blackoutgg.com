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
const AWS = require("aws-sdk");
const { nanoid } = require("nanoid");
const { validate } = require("$util");
const { body, header } = require("express-validator");

const consoleLogout = (req, res, next) => {
  console.log(req.body);
  next();
};

const docClient = new AWS.DynamoDB.DocumentClient();

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
  const user = await User.query()
    .where({ email: req.body.email })
    .select("id", "username", "avatar", "password", "login_attempts")
    .withGraphFetched("[roles.policies, policies]")
    .first();

  if (!user) {
    return res
      .status(422)
      .send({ message: "User doesn't exist or has not been activated." });
  }

  if (user && user.login_attempts === 5) {
    return res.status(400).send({
      message:
        "Due to multiple failed login attempts your account is locked. Reset your password to re-enable your account.",
    });
  }

  const match = await bcrypt.compare(req.body.password, user.password);

  if (!match) {
    if (user.login_attempts !== 5) {
      await User.query().patch({ login_attempts: user.login_attempts + 1 });
    }

    return res.status(422).send({
      message: `Login failed. You have ${
        5 - user.login_attempts
      } more attempts before your account is disabled.`,
    });
  }

  const jti = nanoid();
  const expires = addHours(new Date(), 1);

  // const { roles, ...user } = user;

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

  // const params = {
  //   TableName: "user_sessions",
  //   Item: {
  //     token_id: jti,
  //     user_id: user.id,
  //     // user_roles: docClient.createSet(roles.map(({ id }) => id)),
  //     expires: expires.toISOString(),
  //     ttl: Math.floor(expires.getTime() / 1000),
  //   },
  // };

  // await docClient.put(params).promise();

  const data = {
    jti,
    id: user.id,
    roles: user.roles.map(({ name }) => name),
    level,
    permissions,
  };

  const token = jwt.sign(data, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  const refreshToken = jwt.sign(
    { jti: data.jti, id: data.id },
    process.env.JWT_REFRESH_SECRET
  );

  await UserSession.query().insert({
    token_id: jti,
    user_id: user.id,
    access_token: token,
    refresh_token: refreshToken,
    expires,
  });

  res.status(200).send({ token });
};

module.exports = {
  path: "/login",
  method: "POST",
  middleware: [validators, verifyRecaptcha],
  handler: login,
};
