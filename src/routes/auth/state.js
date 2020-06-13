"use strict";
const randomString = require("crypto-random-string");
const { header } = require("express-validator");

const discordState = async function (req, res) {
  const redis = req.redis;
  const sid = req.query._sid;
  const nonce = randomString({ length: 30 });

  try {
    await redis.set(nonce, nonce, "EX", 180);
    res.status(200).send(nonce);
  } catch (err) {
    console.log(err);
    next(new Error(err));
  }
};

module.exports = {
  path: "/discord/state",
  method: "GET",
  middleware: [header("authorization").isEmpty()],
  handler: discordState,
};
