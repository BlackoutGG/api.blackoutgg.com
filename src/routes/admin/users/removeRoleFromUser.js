"use strict";
const UserRole = require("$models/UserRole");
const UserSession = require("$models/UserSession");
const isFuture = require("date-fns/isFuture");
const diffInSeconds = require("date-fns/differenceInSeconds");
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

  const trx = await UserRole.startTransaction();

  try {
    const details = await UserRole.query(trx)
      .where({ user_id: userId, role_id: roleId })
      .returning(["user_id", "role_id"])
      .first()
      .throwIfNotFound()
      .delete();

    const sessions = await getUserSessions(userId);
    if (sessions) await redis.multi(sessions).exec();

    // const sessions = await UserSession.query()
    //   .where("user_id", userId)
    //   .whereRaw(raw("expires >= CURRENT_TIMESTAMP"))
    //   .select("refresh_token_id", "expires")
    //   .orderBy("created_at", "DESC");

    // if (sessions && sessions.length) {
    //   const commands = sessions.reduce((output, s) => {
    //     const date = s.expires;
    //     const id = s.refresh_token_id;
    //     const key = `blacklist:${id}`;
    //     if (isFuture(date)) {
    //       const diff = diffInSeconds(date, new Date());
    //       output.push(["set", key, id, "NX", "EX", diff]);
    //     }
    //     return output;
    //   }, []);

    //   await redis.multi(commands).exec();
    // }

    await trx.commit();

    res.status(200).send(details);
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
