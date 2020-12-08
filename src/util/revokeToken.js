"use strict";
const UnauthorizedError = require("express-jwt/lib/errors/UnauthorizedError");

class RevokedTokenError extends UnauthorizedError {
  constructor(message) {
    this.code = "jwt_revoked";
    this.message = err.message;
  }
}

module.exports = async function isRevokeToken(req, payload, done) {
  const jti = payload.jti;

  try {
    const token = await req.redis.get(`blacklist:${jti}`);

    const isRevoked = !!token;

    done(isRevoked ? new UnauthorizedError("jwt_revoked") : null, isRevoked);
  } catch (err) {
    done(err);
  }

  // req.redis.get(`${issuer}:${jti}`, (err, token) => {
  //   if (err) return done(err);
  //   return done(null, !!token);
  // });
};
