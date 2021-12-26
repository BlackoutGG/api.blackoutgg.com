"use strict";
const redis = require("$services/redis");

module.exports = async function getCached(key, query, expiryInSeconds = 120) {
  let results;
  try {
    if (await redis.exists(key)) {
      results = JSON.parse(await redis.get(key));
    } else {
      results = await query;

      await redis.set(
        key,
        JSON.stringify(results),
        "NX",
        "EX",
        expiryInSeconds
      );
    }
    return results;
  } catch (err) {
    return Promise.reject(err);
  }
};
