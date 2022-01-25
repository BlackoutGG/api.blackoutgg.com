"use strict";
const User = require("$models/User");
const sanitize = require("sanitize-html");
const getUserSessions = require("$util/getUserSessions");
const guard = require("express-jwt-permissions")();
const redis = require("$services/redis");
const emitter = require("$services/redis/emitter");
const { body, param } = require("express-validator");
const { validate, shouldRevokeToken } = require("$util");
const { VIEW_ALL_ADMIN, UPDATE_ALL_USERS } = require("$util/policies");
const { transaction } = require("objection");

const validators = validate([
  param("id").isNumeric().toInt(10),
  body("active").optional().isBoolean(),
  body("details.username")
    .optional()
    .isAlphanumeric()
    .escape()
    .trim()
    .customSanitizer((v) => sanitize(v)),
  body("details.email").optional().isEmail().normalizeEmail().escape(),
  body("details.avatar").optional().isString().trim(),
  body("altered").optional().default(false).isBoolean(),
  body("addRoles.*").optional().isNumeric(),
  body("addPolicies.*").optional().isNumeric(),
  body("removeRoles.*").optional().isNumeric(),
  body("removePolicies.*").optional().isNumeric(),
]);

const columns = [
  "id",
  "username",
  "email",
  "avatar",
  "active",
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
  const trx = await User.startTransaction();

  try {
    await User.updateUser(req.params.id, req.body, trx);

    if (shouldRevokeToken(req)) {
      const sessions = await getUserSessions(req.params.id);
      if (sessions) await redis.multi(commands).exec();
      emitter
        .of("/index")
        .to(`user:${req.params.id}`)
        .emit("account-change", true);
    }

    await trx.commit();
  } catch (err) {
    await trx.rollback();
    console.log(err);
    next(err);
  }

  const user = await User.query()
    .withGraphFetched("[roles(nameAndId)]")
    .select(columns)
    .where("id", req.params.id)
    .first();

  await redis.del(`user_${req.params.id}`);
  await redis.del(`me_${req.params.id}`);

  console.log(user);

  res.status(200).send(user);
};

module.exports = {
  path: "/:id",
  method: "PATCH",
  middleware: [guard.check([VIEW_ALL_ADMIN, UPDATE_ALL_USERS]), validators],
  handler: updateUser,
};
