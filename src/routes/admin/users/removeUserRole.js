"use strict";
const UserRole = require("$models/UserRole");
const User = require("$models/User");
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

    const result = await UserRole.transaction(async (trx) => {
      const details = await UserRole.query(trx)
        .where({ user_id: userId, role_id: roleId })
        .returning(["user_id", "role_id"])
        .first()
        .throwIfNotFound()
        .delete();

      const token = await User.query(trx)
        .where("id", userId)
        .select("token_id")
        .first();

      return { details, token };
    });

    /** If any permission/role changes are made on the user we revoke the token and force the user to relog. */
    if (!(await req.redis.get(`blacklist:${result.token.token_id}`))) {
      await req.redis.set(`blacklist:${result.token.token_id}`);
    }

    res.status(200).send({ user: result.details });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/:id/role",
  method: "DELETE",
  middleware: [
    guard.check(["view:admin", "update:users"]),
    validate([param("id").isNumeric().toInt(10), query("roleId").isNumeric()]),
  ],
  handler: removeUserRole,
};
