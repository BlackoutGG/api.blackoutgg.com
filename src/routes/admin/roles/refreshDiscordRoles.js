"use strict";
const guard = require("express-validator");
const Settings = require("$models/Settings");
const DiscordRole = require("$models/DiscordRole");
const redis = require("$services/redis");

const { VIEW_ALL_ADMIN, VIEW_ALL_ROLES } = require("$util/policies");
const { getDiscordRoles, checkIfRolesExist } = require("$util");

const refreshDiscordRoles = async (req, res, next) => {
  if (await redis.exists("discord")) {
    const results = JSON.parse(await redis.get("discord"));
    return res.status(200).send(results);
  }

  const { bot_server_id } = await Settings.query()
    .select("bot_server_id")
    .first();

  const roles = await getDiscordRoles(bot_server_id);

  const currentTableItems = await DiscordRole.query();

  const inserts = checkIfRolesExist(roles, currentTableItems);

  let results = null;

  if (inserts && inserts.length) {
    results = await DiscordRole.query().insert(inserts).returning("*");
  } else {
    results = currentTableItems;
  }

  res.status(200).send(results);
};

module.exports = {
  path: "/discord",
  method: "GET",
  middleware: [guard.check([VIEW_ALL_ADMIN, VIEW_ALL_ROLES])],
  handler: refreshDiscordRoles,
};
