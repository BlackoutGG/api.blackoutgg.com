"use strict";
const User = require("$models/User");
const UserSession = require("$models/UserSession");
const sanitize = require("sanitize-html");
const getUserSessions = require("$util/getUserSessions");
const guard = require("express-jwt-permissions")();
const redis = require("$services/redis");
const emitter = require("$services/redis/emitter");
const { body, param } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, UPDATE_ALL_USERS } = require("$util/policies");
const { transaction, raw } = require("objection");
const { isFuture, differenceInSeconds } = require("date-fns");

const validators = validate([
  param("id").isNumeric().toInt(10),
  body("details.username")
    .optional()
    .isAlphanumeric()
    .escape()
    .trim()
    .customSanitizer((v) => sanitize(v)),
  body("details.email").optional().isEmail().normalizeEmail().escape(),
  body("details.avatar").optional().isString().trim(),
  body("altered").isBoolean(),
]);

const columns = [
  "id",
  "username",
  "email",
  "avatar",
  "created_at",
  "updated_at",
];

const graphFn = (id, details, roles, policies) => {
  const data = { id };
  if (details && Object.keys(details)) {
    Object.assign(data, details);
  }
  if (roles && roles.length) {
    Object.assign(data, { roles: roles.map((id) => ({ id })) });
  }
  if (policies && policies.length) {
    Object.assign(data, {
      policies: policies.map((id) => ({ id })),
    });
  }
  return data;
};

const updateUser = async (req, res, next) => {
  const details = req.body.details,
    roles = req.body.roles,
    altered = req.body.altered,
    policies = req.body.policies;

  const options = { relate: true, unrelate: true };

  const trx = await User.startTransaction();

  try {
    await User.query(trx).upsertGraph(
      graphFn(req.params.id, details, roles, policies),
      options
    );
    await trx.commit();
  } catch (err) {
    await trx.rollback();
    console.log(err);
    next(err);
  }

  if (altered) {
    const sessions = await getUserSessions(req.params.id);
    if (sessions) await redis.multi(commands).exec();
    emitter
      .of("/index")
      .to(`user:${req.params.id}`)
      .emit("account-change", true);
    // const sessions = await UserSession.query()
    //   .where("user_id", req.params.id)
    //   .whereRaw(raw("expires >= CURRENT_TIMESTAMP"))
    //   .select("refresh_token_id", "expires")
    //   .orderBy("created_at", "DESC");
    // if (sessions && sessions.length) {
    //   const commands = sessions.reduce((output, s) => {
    //     const date = s.expires;
    //     const id = s.refresh_token_id;
    //     const key = `blacklist:${id}`;
    //     if (isFuture(date)) {
    //       const diff = differenceInSeconds(date, new Date());
    //       output.push(["set", key, id, "NX", "EX", diff]);
    //     }
    //     return output;
    //   }, []);
    //   await redis.multi(commands).exec();
    //   emitter
    //     .of("/index")
    //     .to(`user:${req.params.id}`)
    //     .emit("account-change", true);
    // }
  }
};

module.exports = {
  path: "/:id",
  method: "PATCH",
  middleware: [guard.check([VIEW_ALL_ADMIN, UPDATE_ALL_USERS]), validators],
  handler: updateUser,
};
