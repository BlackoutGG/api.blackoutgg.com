"use strict";
const UserRole = require("$models/UserRole");
const UserSession = require("$models/UserSession");
const isFuture = require("date-fns/isPast");
const diffInSeconds = require("date-fns/differenceInSeconds");
const guard = require("express-jwt-permissions")();
const { param, body } = require("express-validator");
const { validate } = require("$util");

const addRoleToUser = async function (req, res) {
  const userId = parseInt(req.params.id, 10),
    roleId = req.body.roleId;

  const hasRole = await UserRole.query()
    .where("user_id", userId)
    .andWhere("role_id", roleId)
    .first();

  if (hasRole) {
    return res.status(422).send("User already has role.");
  }

  const result = await UserRole.transaction(async (trx) => {
    const role = await UserRole.query(trx)
      .insert({
        user_id: userId,
        role_id: roleId,
      })
      .withGraphFetched("role(nameAndId)")
      .returning("*");

    const token = await UserSession.query()
      .where("user_id", userId)
      .orderBy("created_at", "DESC")
      .limit(1)
      .first();

    return { role, token };
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

  const user = {
    id: userId,
    role: result.role,
  };

  res.status(200).send({ user });
};

module.exports = {
  path: "/:id/role",
  method: "PUT",
  middleware: [
    guard.check("update:users"),
    validate([param("id").isNumeric(), body("roleId").isNumeric()]),
  ],
  handler: addRoleToUser,
};
