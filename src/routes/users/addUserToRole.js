"use strict";
const UserRole = require("./models/UserRole");

const guard = require("express-jwt-permissions")();
const { param, body } = require("express-validator");
const { validate } = require("$util");

const addUserToGroup = async function (req, res) {
  const userId = parseInt(req.params.id, 10),
    roleId = req.body.roleId;

  const hasRole = await UserRole.query()
    .where("user_id", userId)
    .andWhere("role_id", roleId)
    .first();

  if (hasRole) {
    return res.status(422).send("User already has role.");
  }

  const insert = await UserRole.query()
    .insert({
      user_id: userId,
      role_id: roleId,
    })
    .withGraphFetched("role(nameAndId)")
    .returning("*");

  const user = { id: insert.user_id, role: insert.role };

  res.status(200).send({ user });
};

module.exports = {
  path: "/:id/role",
  method: "PUT",
  middleware: [
    guard.check("update:users"),
    validate([param("id").isNumeric(), body("roleId").isNumeric()]),
  ],
  handler: addUserToGroup,
};
