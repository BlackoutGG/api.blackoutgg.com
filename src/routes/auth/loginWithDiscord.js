"use strict";
const UserSession = require("$models/UserSession");
const User = require("$models/User");
const Settings = require("$models/Settings");
const Roles = require("$models/Roles");
const jwt = require("jsonwebtoken");
const DiscordClient = require("$services/discord");
const redis = require("$services/redis");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 12;
const generateTokenData = require("$util/generateTokenData");
const { body } = require("express-validator");
const { nanoid } = require("nanoid");
const { validate } = require("$util");
const { transaction } = require("objection");

const redirect_uri = "http://localhost:3000";

const client = new DiscordClient(
  process.env.DISCORD_CLIENT_ID,
  process.env.DISCORD_SECRET,
  redirect_uri
);

const loginWithDiscord = async (req, res, next) => {
  const { code, state } = req.body;

  if (!code) {
    return res.status(400).send({ message: "Missing code." });
  }

  if (!(await redis.exists(state))) {
    return res.status(400).send({ message: "Code doesn't exist." });
  }

  await redis.del(state);

  const settings = await Settings.query()
    .select(["enable_bot", "bot_server_id"])
    .first();

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

    let user = await User.query()
      .where("discord_id", dUser.id)
      .where("active", true)
      .select("id", "username", "avatar", "discord_id")
      .withGraphFetched("[roles.policies, policies]")
      .first();

    if (!user) {
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      const password = await bcrypt.hash(nanoid(50), salt);

      let roles = [{ id: 2, assigned_by: "site" }];

      if (settings.enable_bot && settings.bot_server_id) {
        const guildMember = await client.getGuildMember(
          process.env.DISCORD_BOT_TOKEN,
          settings.bot_server_id,
          dUser.id
        );

        const discordAssignedRoles = await Roles.query()
          .joinRelated("discord_roles")
          .select("roles.id as id")
          .whereIn("discord_role_id", guildMember._roles);

        console.log(discordAssignedRoles);

        if (discordAssignedRoles && discordAssignedRoles.length) {
          /** grab the role ids assigned by discord, filter out any duplicate ids using uniqBy */
          roles = [
            ...roles,
            ...discordAssignedRoles.map(({ id }) => ({
              id,
              assigned_by: "discord",
            })),
          ];

          console.log(roles);
        }
      }

      const data = {
        local: false,
        discord_id: dUser.id,
        username: `${dUser.username}_${dUser.discriminator}`,
        avatar: dUser.avatarUrl(),
        email: dUser.email,
        active: true,
        password,
      };

      user = await User.createUser(data, roles, trx);
    }

    const tokenData = generateTokenData(user);

    const access_token = jwt.sign(tokenData, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_TOKEN_DURATION,
    });

    const refreshData = {
      jti: tokenData.refresh_jti,
      id: tokenData.id,
    };

    const refresh_token = jwt.sign(
      refreshData,
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_TOKEN_DURATION,
      }
    );

    await UserSession.createSession(user, tokenData, trx);

    await trx.commit();

    res.status(200).send({ access_token, refresh_token });
  } catch (err) {
    console.log(err);
    await trx.rollback();
    next(err);
  }
};

module.exports = {
  path: "/discord",
  method: "POST",
  middleware: [
    validate([
      // header("authorization").isEmpty(),
      // body("state").isObject(),
      body("state")
        .notEmpty()
        .isString()
        .escape()
        .trim()
        .withMessage("Missing State."),
      body("code")
        .notEmpty()
        .isString()
        .escape()
        .trim()
        .withMessage("Missing code."),
    ]),
  ],
  handler: loginWithDiscord,
};
