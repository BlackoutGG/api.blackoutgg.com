"use strict";
const User = require("$models/User");
const UserSession = require("$models/UserSession");
const UnauthorizedError = require("express-jwt/lib/errors/UnauthorizedError");
const generateTokenData = require("$util/generateTokenData");
const jwt = require("jsonwebtoken");
const redis = require("$services/redis");
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

const select = ["users.id", "users.username", "users.discord_id"];

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
    .select(select)
    .withGraphFetched("[roles.policies, policies]")
    .first();

  if (!session) {
    return next(
      new UnauthorizedError("refresh_expired", {
        message: "Refresh token has expired.",
      })
    );
  }

  const tokenData = generateTokenData(session);

  const access_token = jwt.sign(tokenData, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TOKEN_DURATION,
  });

  /** UPDATE THE SESSION DATA WITH THE NEW ACCESS TOKEN JTI */

  await UserSession.query()
    .patch({ token_id: tokenData.jti })
    .where("token_id", token.jti);

  // await redis.del(`blacklist:${session.jti}`);

  res.status(200).send({ access_token });
};

module.exports = {
  path: "/refresh",
  method: "POST",
  // middleware: [validators],
  handler: refreshToken,
};
