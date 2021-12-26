"use strict";
const Roles = require("$models/Roles");
const DiscordRoles = require("$models/DiscordRole");
const Settings = require("$models/Settings");
const Policies = require("$models/Policies");
const guard = require("express-jwt-permissions")();
const getCache = require("$util/getCache");
const { query } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, VIEW_ALL_ROLES } = require("$util/policies");

const select = [
  "id",
  "name",
  "level",
  "is_deletable",
  "is_removable",
  "created_at",
  "updated_at",
];

const getAllRoles = async function (req, res, next) {
  const nextCursor = req.query.nextCursor;
  const isInitial = req.query.isInitial;

  const settings = await Settings.query().select("enable_bot").first();

  const roleQuery = Roles.query()
    .select(
      select,
      Roles.$relatedQuery("users")
        .count("users.id")
        .as("members")
        .whereColumn("roles.id", "user_roles.role_id")
    )
    .orderBy("id", "ASC")
    .where("level", ">=", req.user.level)
    .limit(req.query.limit || 50);

  let query = null;
  let response = {};

  /**Grab policies on the first page request per client */
  if (isInitial) {
    const cached = await getCache("policies", Policies.query());
    const policies = cached.filter(({ level }) => level === req.user.level);

    if (settings.enable_bot) {
      Object.assign(response, {
        discord: await getCache("discord", DiscordRoles.query()),
      });
    }

    Object.assign(response, { policies });
  }

  if (nextCursor) query = await roleQuery.clone().cursorPage(nextCursor);
  else query = await roleQuery.clone().cursorPage();

  Object.assign(response, { roles: query });

  res.status(200).send(response);
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [
    guard.check([VIEW_ALL_ADMIN, VIEW_ALL_ROLES]),
    validate([
      query("nextCursor").optional().isString().escape().trim(),
      query("isInitial").isBoolean(),
      query("limit").optional().isNumeric().toInt(10).default(25),
    ]),
  ],
  handler: getAllRoles,
};
