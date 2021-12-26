"use strict";
const Roles = require("$models/Roles");
const guard = require("express-jwt-permissions")();

const redis = require("$services/redis");
const { query } = require("express-validator");
const { validate } = require("$util");
const { transaction } = require("objection");
const { VIEW_ALL_ADMIN, DELETE_ALL_ROLES } = require("$util/policies");
const getUserSessionsByRoleID = require("$util/getUserSessionsByRoleID");

const middleware = [
  guard.check([VIEW_ALL_ADMIN, DELETE_ALL_ROLES]),
  validate([query("ids.*").isNumeric()]),
];

const removeRole = async function (req, res, next) {
  const trx = await Roles.startTransaction();

  let deleted = 0;

  try {
    deleted = await Roles.query(trx)
      .whereIn("id", req.query.ids)
      .where("is_deletable", true)
      .returning("ids")
      .delete();

    await trx.commit();
  } catch (err) {
    console.log(err);
    await trx.rollback();
    return next(err);
  }

  if (deleted) {
    const pipeline = redis.pipeline();
    req.query.ids.forEach((id) => pipeline.del(`role_${id}`));
    const sessions = await getUserSessionsByRoleID(req.query.ids);
    if (sessions && sessions.length) await redis.multi(sessions).exec();
    pipeline.exec();
    await redis.del("roles");
  }

  res.status(200).send(deleted);
};

module.exports = {
  path: "/",
  method: "DELETE",
  middleware,
  handler: removeRole,
};
