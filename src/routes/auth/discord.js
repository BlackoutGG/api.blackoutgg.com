"use strict";
const { header, body } = require("express-validator");
const { validate } = require("$util");
const DiscordClient = require("$services/discord");

const redirect_uri = "http://localhost:8080/login/discord";

const getGuildMember = async (client, code, guild) => {
  return new Promise(async (resolve, reject) => {
    try {
      const token = await client.getAccess(code);
      const user = await client.getUser(token);
      console.log(user.id);
      const member = await client.getGuildMember(token, guild, user.id);
      resolve(member);
    } catch (err) {
      reject(err);
    }
  });
};

const Client = new DiscordClient(
  process.env.DISCORD_CLIENT_ID,
  process.env.DISCORD_SECRET,
  redirect_uri
);

const discordAuthorize = async function (req, res) {
  const redis = req.redis;
  try {
    const nonce = await redis.get(req.body.state.key);
    if (!nonce) res.boom.badData("State is incorrect.");
    const code = req.body.code;

    await redis.del(nonce);

    const token = await Client.getAccess(code);
    const { id, username, email } = await Client.getUser(token);

    const user = { id, username, email };

    res.status(200).send({ user });
  } catch (err) {
    console.log(err);
    next(new Error(err));
  }
};

module.exports = {
  path: "/discord",
  method: "POST",
  middleware: [
    validate([
      header("authorization").isEmpty(),
      // body("state").isObject(),
      body("code").notEmpty().isString(),
    ]),
  ],
  handler: discordAuthorize,
};
