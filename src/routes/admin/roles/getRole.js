"use strict";
const Roles = require("$models/Roles");
const DiscordRole = require("$models/DiscordRole");
const Policies = require("$models/Policies");
const Settings = require("$models/Settings");
const redis = require("$services/redis");

const guard = require("express-jwt-permissions")();
const { param } = require("express-validator");
const { validate, getDiscordRoles } = require("$util");
const {
  VIEW_ALL_ADMIN,
  VIEW_ALL_ROLES,
  UPDATE_ALL_ROLES,
} = require("$util/policies");

// const select = [
//   "roles.id",
//   "roles.name",
//   "roles.level",
//   "roles.is_deletable",
//   "roles.is_removable",
//   "roles.created_at",
//   "roles.updated_at",
// ];

const select = [
  "id",
  "name",
  "level",
  "is_deletable",
  "is_removable",
  "created_at",
  "updated_at",
];

const getRole = async function (req, res) {
  const settings = await Settings.query().select(["enable_bot"]).first();

  let discord = null;

  if (settings.enable_bot) {
    if (await redis.exists("discord")) {
      discord = JSON.parse(await redis.get("discord"));
    } else {
      discord = await DiscordRole.query();
      await redis.set("discord", JSON.stringify(discord), "NX", "EX", 120);
    }
  }

  const roles = Roles.query()
    .where("id", req.params.id)
    .withGraphFetched("[policies, discord_roles]")
    .first()
    .throwIfNotFound();

  const policies = Policies.query().where("level", ">=", req.user.level);

  const [role, selectable] = await Promise.all([roles, policies]);

  res.status(200).send({
    role,
    selectable,
    discord,
  });
};

module.exports = {
  path: "/:id",
  method: "GET",
  middleware: [
    guard.check([VIEW_ALL_ADMIN, VIEW_ALL_ROLES, UPDATE_ALL_ROLES]),
    validate([param("id").isNumeric().toInt(10)]),
  ],
  handler: getRole,
};
