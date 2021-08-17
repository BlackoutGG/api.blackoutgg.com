"use strict";
const Roles = require("$models/Roles");
const Policies = require("$models/Policies");
const Settings = require("$models/Settings");

const { raw, ref } = require("objection");

const guard = require("express-jwt-permissions")();
const { param } = require("express-validator");
const { validate, getDiscordRoles } = require("$util");
const {
  VIEW_ALL_ADMIN,
  VIEW_ALL_ROLES,
  UPDATE_ALL_ROLES,
} = require("$util/policies");

const getRole = async function (req, res) {
  const _role = Roles.query()
    .alias("r")
    .where("id", req.params.id)
    .withGraphFetched("policies")
    .select(
      raw("SELECT discord_role_id FROM role_maps WHERE role_id = ? ", [
        ref("r.id"),
      ]).as("mapped")
    )
    .first()
    .throwIfNotFound();

  const _policies = Policies.query().where("level", ">=", req.user.level);

  const [role, selectable] = await Promise.all([_role, _policies]);

  console.log(role);

  res.status(200).send({
    role,
    selectable,
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
