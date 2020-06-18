"use strict";
const UserRole = require("./models/UserRole");
const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate } = require("$util");

const removeUserRole = async function (req, res, next) {
  const userId = req.params.id,
    roleId = req.body.roleId;
  try {
    const user = await UserRole.query()
      .where({ user_id: userId, role_id: roleId })
      .returning(["user_id", "role_id"])
      .first()
      .throwIfNotFound()
      .delete();
    res.status(200).send({ user });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/:id/role",
  method: "DELETE",
  middleware: [
    guard.check("users:edit"),
    validate([body("roleId").notEmpty().isNumeric()]),
  ],
  handler: removeUserRole,
};
