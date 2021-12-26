"use strict";
const User = require("$models/User");
const guard = require("express-jwt-permissions")();
const redis = require("$services/redis");
const { query } = require("express-validator");
const { validate, buildQuery } = require("$util");
const { VIEW_ALL_ADMIN, DELETE_ALL_USERS } = require("$util/policies");
const { transaction } = require("objection");
const getUserSessions = require("$util/getUserSessions");

const columns = ["id", "avatar", "username", "email", "created_at"];

const middleware = [
  guard.check([VIEW_ALL_ADMIN, DELETE_ALL_USERS]),
  validate([
    query("ids.*").isNumeric(),
    // query("page").optional().isNumeric().toInt(10),
    // query("limit").optional().isNumeric().toInt(10),
  ]),
];

const removeUser = async function (req, res, next) {
  const filters = req.query.filters || null;

  const trx = await User.startTransaction();

  try {
    const deleted = await User.query(trx)
      .whereIn("id", req.query.ids)
      .delete()
      .returning("id");
    await trx.commit();
    const sessions = await getUserSessions(req.query.ids);
    if (sessions && sessions.length) {
      await redis.multi(sessions).exec();
    }
    const pipeline = redis.pipeline();

    req.query.ids.forEach((id) => {
      pipeline.del(`user_${id}`);
      pipeline.del(`me_${id}`);
    });

    pipeline.exec();

    res.status(200).send(deleted);
  } catch (err) {
    await trx.rollback();
    return next(err);
  }

  // let query = User.query().select(columns).withGraphFetched("roles(nameAndId)");

  // if (filters && Object.keys(filters).length) {
  //   query = query.whereExists(
  //     User.relatedQuery("roles").whereIn("id", filters.id)
  //   );
  // }

  // const users = await buildQuery(query, req.query.page, req.query.limit);

  res.status(200).send({ users });
};

module.exports = {
  path: "/",
  method: "DELETE",
  middleware,
  handler: removeUser,
};
