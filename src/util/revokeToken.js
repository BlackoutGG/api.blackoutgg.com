"use strict";
const UnauthorizedError = require("express-jwt/lib/errors/UnauthorizedError");
class RevokeTokenError extends Error {
  constructor(message) {
    super(message);
    this.name = "RevokeTokenError";
    this.type = "Revoked";
  }
}

module.exports = async function isRevokeToken(req, payload, done) {
  const jti = payload.refresh_jti;

  try {
    const isBlacklisted = await req.redis.exists(`blacklist:${jti}`);

    // if (isBlacklisted) done(new UnauthorizedError("jwt_revoked"));
    // else done(null);

    done(null, isBlacklisted);

    // done(
    //   isBlacklisted ? new RevokeTokenError("jwt_revoked") : null,
    //   isBlacklisted
    // );
  } catch (err) {
    done(err);
  }
};
