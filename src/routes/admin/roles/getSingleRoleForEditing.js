"use strict";
const Roles = require("$models/Roles");
const Permissions = require("$models/Permissions");

const guard = require("express-jwt-permissions")();
const { param } = require("express-validator");
const { validate } = require("$util");

const getSingleRoleForEditing = async function (req, res) {
  const roleQuery = Roles.query()
    .where("id", req.params.id)
    .withGraphFetched("permissions")
    .first()
    .throwIfNotFound();

  const permQuery = Permissions.query().where("level", ">=", req.user.level);

  const [role, selectable] = await Promise.all([roleQuery, permQuery]);
  res.status(200).send({ role, selectable });

  // try {
  //   const [role, selectable] = await Promise.all([roleQuery, permQuery]);
  //   res.status(200).send({ role, selectable });
  // } catch (err) {
  //   next(err);
  // }
};

module.exports = {
  path: "/:id",
  method: "GET",
  middleware: [
    guard.check(["view:admin", "view:roles", "update:roles"]),
    validate([param("id").isNumeric().toInt(10)]),
  ],
  handler: getSingleRoleForEditing,
};
