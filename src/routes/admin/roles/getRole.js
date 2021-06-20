"use strict";
const Roles = require("$models/Roles");
const Policies = require("$models/Policies");

const guard = require("express-jwt-permissions")();
const { param } = require("express-validator");
const { validate } = require("$util");
const {
  VIEW_ALL_ADMIN,
  VIEW_ALL_ROLES,
  UPDATE_ALL_ROLES,
} = require("$util/permissions");

const getRole = async function (req, res) {
  const _role = Roles.query()
    .where("id", req.params.id)
    .withGraphFetched("policies")
    .first()
    .throwIfNotFound();

  const _policies = Policies.query().where("level", ">=", req.user.level);

  const [role, selectable] = await Promise.all([_role, _policies]);
  res.status(200).send({ role, selectable });
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
