"use strict";
const UserRole = require("./models/UserRole");
const guard = require("express-jwt-permissions")();
const { param, query } = require("express-validator");
const { validate } = require("$util");

const removeUserRole = async function (req, res, next) {
  const userId = req.params.id,
    roleId = req.query.roleId;
  try {
    const user = await UserRole.query()
      .where({ user_id: userId, role_id: roleId })
      .returning(["user_id", "role_id"])
      .first()
      .throwIfNotFound()
      .delete();
    res.status(200).send({ user });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/:id/role",
  method: "DELETE",
  middleware: [
    guard.check("update:users"),
    validate([param("id").isNumeric().toInt(10), query("roleId").isNumeric()]),
  ],
  handler: removeUserRole,
};
