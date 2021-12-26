"use strict";
const redis = require("$services/redis");

module.exports = async function isRevokeToken(req, payload, done) {
  const jti = payload.refresh_jti;

  try {
    const isBlacklisted = await redis.exists(`blacklist:${jti}`);

    done(null, isBlacklisted);
  } catch (err) {
    done(err);
  }
};
