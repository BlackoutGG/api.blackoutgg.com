"use strict";
const isFuture = require("date-fns/isFuture");
const Roles = require("./models/Roles");
const UserSession = require("$models/UserSession");
const guard = require("express-jwt-permissions")();
const sanitize = require("sanitize-html");
const redis = require("$services/redis");
const getUserSessionsByRoleID = require("$util/getUserSessionsByRoleID");
const diffInSeconds = require("date-fns/differenceInSeconds");
const { param, body } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, UPDATE_ALL_ROLES } = require("$util/policies");
const { transaction, raw } = require("objection");

const validators = validate([
  param("id").isNumeric().toInt(10),
  body("details.name")
    .optional()
    .isAlphanumeric()
    .escape()
    .trim()
    .customSanitizer((v) => sanitize(v)),
  body("details.level")
    .optional()
    .custom((v, { req }) => v >= req.user.level),
  body("discord_roles.*").optional().isNumeric(),
  body("policies.*").optional().isNumeric(),
  body("altered").default(false).isBoolean(),
]);

const middleware = [
  guard.check([VIEW_ALL_ADMIN, UPDATE_ALL_ROLES]),
  validators,
];

const graphFn = (id, details, policies, discord_roles) => {
  const data = { id };

  if (details && Object.keys(details)) {
    Object.assign(data, details);
  }

  if (policies && policies.length) {
    Object.assign(data, {
      policies: policies.map((policy) => ({ id: policy })),
    });
  }

  if (discord_roles && discord_roles.length) {
    Object.assign(data, {
      discord_roles: discord_roles.map((role) => ({
        id: role,
      })),
    });
  }

  // Object.assign(data, {
  //   policies: policies.map((p) => ({
  //     id: p,
  //   })),
  //   discord_roles: discord_roles.map((role) => ({
  //     id: role,
  //   })),
  // });

  return data;
};

const updateRole = async (req, res, next) => {
  const details = req.body.details,
    altered = req.body.altered,
    discord = req.body.discord_roles,
    policies = req.body.policies;

  const trx = await Roles.startTransaction();

  const upsert = graphFn(req.params.id, details, policies, discord);
  const upsertOptions = { relate: true, unrelate: true, noDelete: true };

  try {
    await Roles.query(trx).upsertGraph(upsert, upsertOptions);
    await trx.commit();
  } catch (err) {
    console.log(err);
    await trx.rollback();
    next(err);
  }

  if (altered) {
    const sessions = await getUserSessionsByRoleID(req.params.id);
    if (sessions) await redis.multi(sessions).exec();
    // const sessions = await UserSession.query()
    //   .joinRelated("user.roles")
    //   .where("user:roles.id", req.params.id)
    //   .whereRaw(raw("expires >= CURRENT_TIMESTAMP"))
    //   .select(["user_sessions.refresh_token_id", "expires"])
    //   .orderBy("user_sessions.created_at", "DESC");

    // // .distinctOn("user_sessions.user_id");

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

    // await redis.multi(commands).exec();
    // }
  }

  res.sendStatus(204);
};

module.exports = {
  path: "/:id",
  method: "PATCH",
  middleware,
  handler: updateRole,
};
