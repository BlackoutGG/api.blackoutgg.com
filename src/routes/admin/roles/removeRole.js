"use strict";
const Roles = require("./models/Roles");
const UserSession = require("$models/UserSession");
const guard = require("express-jwt-permissions")();
const isFuture = require("date-fns/isFuture");
const diffInSeconds = require("date-fns/differenceInSeconds");
const redis = require("$services/redis");
const { query } = require("express-validator");
const { validate, buildQuery } = require("$util");
const { transaction, raw } = require("objection");
const { VIEW_ALL_ADMIN, DELETE_ALL_ROLES } = require("$util/policies");
const getUserSessionsByRoleID = require("$util/getUserSessionsByRoleID");

const middleware = [
  guard.check([VIEW_ALL_ADMIN, DELETE_ALL_ROLES]),
  validate([
    query("ids.*").isNumeric(),
    query("page").optional().isNumeric(),
    query("limit").optional().isNumeric(),
  ]),
];

const removeRole = async function (req, res, next) {
  const trx = await Roles.startTransaction();

  try {
    const deleted = await Roles.query(trx)
      .whereIn("id", req.query.ids)
      .where("is_deletable", true)
      .delete();

    // if (!deleted || !deleted.length) {
    //   await trx.rollback();
    //   return res
    //     .status(400)
    //     .send({ message: "A number of roles were not illegible for removal." });
    // }

    // const sessions = await UserSession.query()
    //   .joinRelated("user.roles")
    //   .whereIn("user:roles.id", req.query.ids)
    //   .whereRaw(raw("expires >= CURRENT_TIMESTAMP"))
    //   .select(["user_sessions.refresh_token_id", "expires"])
    //   .groupBy("user_sessions.created_at")
    //   .orderBy("user_sessions.created_at", "DESC");

    // const sessions = uniqBy(
    //   await UserSession.query()
    //     .joinRelated("user.roles")
    //     .whereIn("user:roles.id", req.query.ids)
    //     .whereRaw(raw("expires >= CURRENT_TIMESTAMP"))
    //     .select(["user_sessions.refresh_token_id", "expires"])
    //     // .groupBy("user_sessions.refresh_token_id")
    //     .orderBy("user_sessions.created_at", "DESC"),
    //   "refresh_token_id"
    // );
    // .distinctOn("user_sessions.refresh_token_id")

    // if (sessions && sessions.length) {
    //   console.log(sessions);

    //   const commands = sessions.reduce((output, s) => {
    //     const timestamp = s.expires;

    //     if (isFuture(timestamp)) {
    //       const diff = diffInSeconds(timestamp, new Date());
    //       const id = s.refresh_token_id;
    //       const key = `blacklist:${id}`;
    //       output.push(["set", key, id, "NX", "EX", diff]);
    //     }
    //     return output;
    //   }, []);

    //   await redis.multi(commands).exec();
    // }

    await trx.commit();
  } catch (err) {
    console.log(err);
    await trx.rollback();
    next(err);
  }

  const sessions = await getUserSessionsByRoleID(req.query.ids);
  if (sessions && sessions.length) await redis.multi(sessions).exec();

  const roles = await buildQuery(Roles.query(), req.body.page, req.body.limit);

  res.status(200).send(roles);
};

module.exports = {
  path: "/",
  method: "DELETE",
  middleware,
  handler: removeRole,
};
