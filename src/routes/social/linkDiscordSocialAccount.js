"use strict";
const User = require("$models/User");
const Settings = require("$models/Settings");
const Roles = require("$models/Roles");
const DiscordClient = require("$services/discord");
const redis = require("$services/redis");
const emitter = require("$services/redis/emitter");
const uniqBy = require("lodash.uniqby");
const sanitize = require("sanitize-html");
const { body } = require("express-validator");
const { validate } = require("$util");
const { transaction } = require("objection");

const redirect_uri = "http://localhost:3000/social/discord";

const client = new DiscordClient(
  process.env.DISCORD_CLIENT_ID,
  process.env.DISCORD_SECRET,
  redirect_uri
);

const linkDiscordSocialAccount = async (req, res, next) => {
  const code = req.body.code,
    state = req.body.state;

  if (!code) {
    return res.status(400).send({ message: "Code doesn't exist." });
  }

  if (!(await redis.exists(`link:${state}`))) {
    return res.status(400).send({ message: "State is invalid." });
  }

  await redis.del(`link:${state}`);

  const [user, settings] = await Promise.all([
    User.query().whereNull("discord_id").first(),
    Settings.query().select(["enable_bot", "bot_server_id"]).first(),
  ]);

  if (!user) {
    return res
      .status(400)
      .send({ message: "User already has a discord account linked." });
  }

  // const roles = user.roles.map((role) => ({ id: role.id }));

  const trx = await User.startTransaction();

  try {
    const dUser = await client.getCurrentUser(code);

    if (!dUser) {
      await trx.rollback();
      return res.status(404).send({ message: "Discord user doesn't exist." });
    }

    if (!dUser.emailVerified) {
      await trx.rollback();
      return res
        .status(400)
        .send({ message: "User must have a verified email address" });
    }

    const options = { relate: true, unrelate: false, noDelete: true };

    // const queryData = { id, discord_id: dUser.id, roles };

    const queryData = { id: parseInt(req.user.id, 10), discord_id: dUser.id };

    if (settings.enable_bot && settings.bot_server_id) {
      const guildMember = await client.getGuildMember(
        process.env.DISCORD_BOT_TOKEN,
        settings.bot_server_id,
        dUser.id
      );

      const roles = await Roles.query()
        .joinRelated("discord_roles")
        .select("roles.id as id")
        .whereIn("discord_role_id", guildMember._roles);

      console.log(roles);

      if (roles && roles.length) {
        // queryData.roles = uniqBy([...roles, ...mapped], "id");
        Object.assign(queryData, {
          roles: roles.map(({ id }) => ({ id, assigned_by: "discord" })),
        });
      }
    }

    await User.query(trx).upsertGraph(queryData, options);
    await trx.commit();

    emitter.of("/index").to(`user:${req.user.id}`).emit("linked", "linked");

    res.status(200).send("OK");
  } catch (err) {
    console.log(err);
    await trx.rollback();
    // if (id) emitter.to(`user:${userId}`).emit("error", err.message);
    next(err);
  }
};

module.exports = {
  path: "/discord",
  method: "POST",
  middleware: [
    body("state")
      .isString()
      .escape()
      .trim()
      .customSanitizer((v) => sanitize(v)),
    body("code")
      .isString()
      .escape()
      .trim()
      .customSanitizer((v) => sanitize(v)),
  ],
  handler: linkDiscordSocialAccount,
};
