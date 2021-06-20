"use strict";
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

    done(
      isBlacklisted ? new RevokeTokenError("jwt_revoked") : null,
      isBlacklisted
    );
  } catch (err) {
    done(err);
  }
};
