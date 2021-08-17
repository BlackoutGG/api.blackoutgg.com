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
const uniq = require("lodash/uniq");
const addHours = require("date-fns/addHours");

const { header, body } = require("express-validator");
const { nanoid } = require("nanoid");
const { validate, getDiscordRoles } = require("$util");
const { transaction } = require("objection");

const redirect_uri = "http://localhost:3000";

const insertFn = (info, roles) => {
  return {
    "#id": "newUser",
    ...info,
    last_activation_email_sent: new Date().toISOString(),
    // roles: [{ id: 2 }],
    roles,
  };
};

const client = new DiscordClient(
  process.env.DISCORD_CLIENT_ID,
  process.env.DISCORD_SECRET,
  redirect_uri
);

const loginWithDiscord = async (req, res, next) => {
  const { code, state } = req.body;

  if (!(await redis.exists(state))) {
    return res.status(400).send({ message: "Code doesn't exist." });
  }

  await redis.del(state);

  const settings = await Settings.query().select([
    "bot_enabled",
    "bot_server_id",
  ]);

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
      .select("id", "username", "avatar")
      .withGraphFetched("[roles.policies, policies]")
      .first();

    if (!user) {
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      const password = await bcrypt.hash(nanoid(50), salt);

      let roles = [{ id: 2 }];

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

        if (mapped.length) roles = mapped;
      }

      const data = {
        discord_id: dUser.id,
        username: `${dUser.username}_${dUser.discriminator}`,
        avatar: dUser.avatarUrl(),
        email: dUser.email,
        active: true,
        password,
      };

      user = await User.query(trx)
        .insertGraph(insertFn(data, roles), {
          relate: true,
          noDelete: true,
        })
        .withGraphFetched("[roles.policies, policies]");
    }

    const rolePolicies = user.roles.flatMap(({ policies }) =>
      policies.map(({ action, target, resource }) => {
        return `${action}:${target}:${resource}`;
      })
    );

    const userPolicies = user.policies.map(
      ({ action, target, resource }) => `${action}:${target}:${resource}`
    );

    const permissions = uniq([...userPolicies, ...rolePolicies]);

    const level = Math.min(user.roles.map(({ level }) => level));

    const access_jti = nanoid();
    const refresh_jti = nanoid();
    const expires = addHours(new Date(), 1);

    const data = {
      jti: access_jti,
      refresh_jti,
      id: user.id,
      username: user.username,
      roles: user.roles.map(({ name }) => name),
      level,
      permissions,
    };

    const access_token = jwt.sign(data, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_TOKEN_DURATION,
    });

    const refresh_token = jwt.sign(
      { jti: refresh_jti, id: data.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "1h" }
    );

    await trx.commit();

    await UserSession.query().insert({
      token_id: access_jti,
      refresh_token_id: refresh_jti,
      user_id: user.id,
      expires,
    });

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
