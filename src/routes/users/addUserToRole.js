"use strict";
const Roles = require("$models/Roles");
const UserRole = require("./models/UserRole");
const Users = require("./models/User");
const guard = require("express-jwt-permissions")();
const { param, body } = require("express-validator");
const { validate } = require("$util");

const addUserToGroup = async function (req, res, next) {
  const userId = parseInt(req.params.id, 10),
    roleId = req.body.roleId;
  try {
    const hasRole = await UserRole.query()
      .where("user_id", userId)
      .andWhere("role_id", roleId)
      .first();

    if (hasRole) {
      return res.status(422).send("User already has role.");
    }

    const insert = UserRole.query()
      .insert({
        user_id: userId,
        role_id: roleId,
      })
      .returning("*");

    const fetch = Roles.query()
      .where({ id: roleId })
      .select("id", "name")
      .throwIfNotFound()
      .first();

    const [userRoles, role] = await Promise.all([insert, fetch]);

    const user = { id: userRoles.user_id, role };

    res.status(200).send({ user });
  } catch (err) {
    console.log(err);
    next(new Error(err));
  }
};

module.exports = {
  path: "/:id/role",
  method: "PUT",
  middleware: [
    guard.check("users:edit"),
    validate([param("id").isNumeric(), body("roleId").isNumeric()]),
  ],
  handler: addUserToGroup,
};
