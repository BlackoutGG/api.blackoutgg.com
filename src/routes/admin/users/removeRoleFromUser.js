"use strict";
const User = require("$models/User");
const getUserSessions = require("$util/getUserSessions");
const guard = require("express-jwt-permissions")();
const redis = require("$services/redis");
const { param, query } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, UPDATE_ALL_USERS } = require("$util/policies");
const { transaction, raw } = require("objection");

const removeUserRole = async function (req, res, next) {
  const userId = req.params.id,
    roleId = req.query.roleId;

  const trx = await User.startTransaction();

  try {
    await User.relatedQuery("roles", trx)
      .for(userId)
      .unrelate()
      .where("id", roleId)
      .throwIfNotFound();

    const sessions = await getUserSessions(userId);
    if (sessions) await redis.multi(sessions).exec();
    await trx.commit();
    await redis.del(`user_${userId}`);
    await redis.del(`me_${userId}`);
    res.status(200).send({ user_id: userId, role_id: roleId });
  } catch (err) {
    await trx.rollback();
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/:id/role",
  method: "DELETE",
  middleware: [
    guard.check([VIEW_ALL_ADMIN, UPDATE_ALL_USERS]),
    validate([
      param("id").isNumeric().toInt(10),
      query("roleId").isNumeric().toInt(10),
    ]),
  ],
  handler: removeUserRole,
};
