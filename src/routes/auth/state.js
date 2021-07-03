"use strict";
const { header } = require("express-validator");
const { nanoid } = require("nanoid");

const createDiscordState = async function (req, res, next) {
  const nonce = nanoid(32);
  await req.redis.set(nonce, nonce, "EX", 180);
  res.status(200).send(nonce);
};

module.exports = {
  path: "/discord",
  method: "GET",
  // middleware: [header("authorization").isEmpty()],
  handler: createDiscordState,
};
