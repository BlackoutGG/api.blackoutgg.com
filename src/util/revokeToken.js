"use strict";

module.exports = async function isRevokeToken(req, payload, done) {
  const jti = payload.jti;

  try {
    const token = await req.redis.get(`blacklist:${jti}`);

    done(null, !!token);
  } catch (err) {
    done(err);
  }

  // req.redis.get(`${issuer}:${jti}`, (err, token) => {
  //   if (err) return done(err);
  //   return done(null, !!token);
  // });
};
