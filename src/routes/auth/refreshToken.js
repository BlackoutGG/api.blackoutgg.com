"use strict";
const User = require("$models/User");
const UserSession = require("$models/UserSession");
const UnauthorizedError = require("express-jwt/lib/errors/UnauthorizedError");
const jwt = require("jsonwebtoken");
const redis = require("$services/redis");
const uniq = require("lodash.uniq");
const { nanoid } = require("nanoid");
const { body } = require("express-validator");
const { validate } = require("$util");
const { raw } = require("objection");

const validators = validate([
  body("refresh_token").custom((v, { req }) => {
    if (!"^[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_.+/=]*$".test(v)) {
      throw new Error("Malformed refresh token.");
    }
    return true;
  }),
]);

const refreshToken = async (req, res, next) => {
  const { refresh_token } = req.body;

  const token = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);

  if (!token) return res.status(400).send({ message: "Token was malformed." });

  if (await redis.exists(`blacklist:${token.jti}`)) {
    return next(
      new UnauthorizedError("jwt_revoked", {
        message: "The token has been revoked.",
      })
    );
  }

  const session = await User.query()
    .joinRelated("session")
    .where("session.refresh_token_id", token.jti)
    .where(raw("expires >= CURRENT_TIMESTAMP"))
    .select("users.id", "users.username", "token_id")
    .withGraphFetched("[roles.policies, policies]")
    .first();

  if (!session) {
    return next(
      new UnauthorizedError("refresh_expired", {
        message: "Refresh token has expired.",
      })
    );
  }

  const rolePolicies = session.roles.flatMap(({ policies }) =>
    policies.map(({ action, target, resource }) => {
      return `${action}:${target}:${resource}`;
    })
  );

  const userPolicies = session.policies.map(
    ({ action, target, resource }) => `${action}:${target}:${resource}`
  );

  const permissions = uniq([...userPolicies, ...rolePolicies]);

  const level = Math.min(session.roles.map(({ level }) => level));

  const jti = nanoid();

  const data = {
    jti,
    id: session.id,
    username: session.username,
    roles: session.roles.map(({ name }) => name),
    level,
    permissions,
  };

  const access_token = jwt.sign(data, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TOKEN_DURATION,
  });

  await UserSession.query()
    .patch({ token_id: jti })
    .where("token_id", token.jti);

  await redis.del(`blacklist:${session.jti}`);

  res.status(200).send({ access_token });
};

module.exports = {
  path: "/refresh",
  method: "POST",
  // middleware: [validators],
  handler: refreshToken,
};
