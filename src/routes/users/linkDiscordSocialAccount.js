"use strict";
const User = require("$models/User");
const Settings = require("$models/Settings");
const DiscordClient = require("$services/discord");
const uniqBy = require("lodash.uniqby");
const sanitize = require("sanitize-html");
const { body } = require("express-validator");
const { validate } = require("$util");
const { transaction } = require("objection");
const redis = require("$services/redis");
const emitter = require("$services/redis/emitter");

const redirect_uri = "http://localhost:5000/user/discord/link";

const client = new DiscordClient(
  process.env.DISCORD_CLIENT_ID,
  process.env.DISCORD_SECRET,
  redirect_uri
);

const linkDiscordSocialAccount = async (req, res, next) => {
  const code = req.body.code,
    s = req.body.state.split(":");

  const id = s[0],
    state = s[1];

  if (!(await req.redis.exists(state))) {
    return res.status(400).send({ message: "Code doesn't exist." });
  }

  await req.redis.del(s[1]);

  const [user, settings] = await Promise.all([
    User.query().whereNull("discord_id").withGraphFetched("roles").first(),
    Settings.query().select(["bot_enabled", "bot_server_id"]).first(),
  ]);

  if (!user) {
    return res
      .status(400)
      .send({ message: "User already has a discord account linked." });
  }

  const roles = user.roles.map((role) => ({ id: role.id }));

  const socketID = await redis.get(`users:${id}`);

  const trx = await User.startTransaction();

  try {
    const dUser = await client.getCurrentUser(code);

    if (!dUser) {
      await trx.rollback();
      return res.status(500).send({ message: "User doesn't exist." });
    }

    if (!dUser.emailVerified) {
      await trx.rollback();
      return res
        .status(400)
        .send({ message: "User must have a verified email address" });
    }

    const options = { relate: true, unrelate: true };

    const queryData = { id, discord_id: dUser.id, roles };

    if (settings.bot_enabled && settings.bot_server_id) {
      const guildMember = await client.getGuildMember(
        process.env.DISCORD_BOT_TOKEN,
        settings.bot_server_id,
        dUser.id
      );

      const mapped = await Roles.query()
        .innerJoin("roles_mapped", () => {
          this.on("roles.id", "=", "roles_mapped.role_id");
          this.whereIn(
            "roles_mapped.discord_role_id",
            guildMember.roles.map((role) => role.id)
          );
        })
        .select("roles.id as id");

      if (mapped && mapped.length) {
        queryData.roles = uniqBy([...roles, ...mapped], "id");
        // Object.assign(queryData, {
        //   roles: uniqBy([...roles, ...mapped], "id"),
        // });
      }
    }

    await User.query(trx).upsertGraph(queryData, options);
    await trx.commit();

    emitter.to(socketID).emit("linked");

    res.status(200).send();
  } catch (err) {
    await trx.rollback();
    emitter.to(socketID).emit("error", err.message);
    next(err);
  }
};

module.exports = {
  path: "/discord/link",
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
