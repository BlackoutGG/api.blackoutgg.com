"use strict";
const UserRole = require("$models/UserRole");
const getUserSessions = require("$util/getUserSessions");
const guard = require("express-jwt-permissions")();
const redis = require("$services/redis");
const { param, body } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, UPDATE_ALL_USERS } = require("$util/policies");
const { transaction } = require("objection");

const addRoleToUser = async function (req, res, next) {
  const userId = req.params.id,
    roleId = req.body.roleId;

  const hasRole = await UserRole.query()
    .where("user_id", userId)
    .andWhere("role_id", roleId)
    .first();

  if (hasRole) {
    return res.status(422).send("User already has role.");
  }

  const trx = await UserRole.startTransaction();

  try {
    const user = await UserRole.query(trx)
      .insert({
        user_id: userId,
        role_id: roleId,
        assigned_by: "site",
      })
      .withGraphFetched("role(nameAndId)")
      .returning("*");

    const sessions = await getUserSessions(userId);
    if (sessions && sessions.length) await redis.multi(sessions).exec();

    await trx.commit();
    await redis.del(`user_${userId}`);
    await redis.del(`me_${userId}`);

    const payload = {
      user_id: user.user_id,
      role: user.role,
    };

    res.status(200).send(payload);
  } catch (err) {
    console.log(err);
    await trx.rollback();
    next(err);
  }
};

module.exports = {
  path: "/:id/role",
  method: "PATCH",
  middleware: [
    guard.check([VIEW_ALL_ADMIN, UPDATE_ALL_USERS]),
    validate([
      param("id").isNumeric().toInt(10),
      body("roleId").isNumeric().toInt(10),
    ]),
  ],
  handler: addRoleToUser,
};
