"use strict";
// const UnauthorizedError = require("express-jwt/lib/errors/UnauthorizedError");

// class RevokedTokenError extends UnauthorizedError {
//   constructor(message) {
//     // this.code = "jwt_revoked";
//     this.message = message;
//   }
// }

class RevokeTokenError extends Error {
  constructor(message) {
    super(message);
    this.name = "RevokeTokenError";
    this.type = "Revoked";
  }
}

module.exports = async function isRevokeToken(req, payload, done) {
  const jti = payload.jti;

  try {
    const isBlacklisted = await req.redis.exists(`blacklist:${jti}`);

    // const isRevoked = !!token;

    done(
      isBlacklisted ? new RevokeTokenError("jwt_revoked") : null,
      isBlacklisted
    );
  } catch (err) {
    done(err);
  }

  // req.redis.get(`${issuer}:${jti}`, (err, token) => {
  //   if (err) return done(err);
  //   return done(null, !!token);
  // });
};
