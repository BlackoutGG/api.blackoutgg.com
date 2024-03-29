"use strict";
const Roles = require("$models/Roles");
const DiscordRole = require("$models/DiscordRole");
const Policies = require("$models/Policies");
const Settings = require("$models/Settings");
const getCache = require("$util/getCache");

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
  const settings = await Settings.query()
    .select(["enable_bot", "bot_server_id"])
    .first();

  let discord = null;

  if (settings.enable_bot && settings.bot_server_id) {
    discord = await getCache("discord", DiscordRole.query());
  }

  const roleQuery = Roles.query()
    .where("id", req.params.id)
    .select(select)
    .withGraphFetched("[policies, discord_roles]")
    .first()
    .throwIfNotFound();

  // const cached = await getCached("policies", Policies.query());

  // const policies = cached.filter(({ level }) => level === req.user.level);

  const [role, selectable] = await Promise.all([
    getCache(`role_${req.params.id}`, roleQuery),
    Policies.query().where("level", ">=", req.user.level),
  ]);

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
