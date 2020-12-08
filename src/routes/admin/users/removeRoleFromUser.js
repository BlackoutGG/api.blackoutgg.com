"use strict";
const UserRole = require("$models/UserRole");
const UserSession = require("$models/UserSession");
const isFuture = require("date-fns/isFuture");
const diffInSeconds = require("date-fns/differenceInSeconds");

const guard = require("express-jwt-permissions")();
const { param, query } = require("express-validator");
const { validate } = require("$util");

const removeUserRole = async function (req, res, next) {
  const userId = req.params.id,
    roleId = req.query.roleId;
  try {
    const result = await UserRole.transaction(async (trx) => {
      const details = await UserRole.query(trx)
        .where({ user_id: userId, role_id: roleId })
        .returning(["user_id", "role_id"])
        .first()
        .throwIfNotFound()
        .delete();

      const token = await UserSession.query()
        .where("user_id", userId)
        .orderBy("created_at", "DESC")
        .limit(1)
        .first();

      return { details, token };
    });

    /** If any permission/role changes are made on the user we revoke the token and force the user to relog. */
    if (result.token) {
      const date = new Date(result.token.expires_on);
      if (isFuture(date)) {
        const exists = await req.redis.exists(
          `blacklist:${result.token.token_id}`
        );

        if (!exists) {
          await req.redis.set(
            `blacklist:${result.token.token_id}`,
            `blacklist:${result.token.token_id}`,
            "EX",
            diffInSeconds(date, Date.now())
          );
        }
      }
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
