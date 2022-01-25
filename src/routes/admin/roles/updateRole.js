"use strict";
const Roles = require("$models/Roles");
const guard = require("express-jwt-permissions")();
const sanitize = require("sanitize-html");
const redis = require("$services/redis");
const getUserSessionsByRoleID = require("$util/getUserSessionsByRoleID");

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
    .isNumeric()
    .custom((v, { req }) => v >= req.user.level),
  body("addPolicies.*").optional().isNumeric(),
  body("removePolicies.*").optional().isNumeric(),
  body("addDiscordRoles.*").optional().isNumeric(),
  body("removeDiscordRoles.*").optional().isNumeric(),
  // body("discord_roles.*").optional().isNumeric(),
  // body("policies.*").optional().isNumeric(),
  body("altered").default(false).isBoolean(),
]);

const middleware = [
  guard.check([VIEW_ALL_ADMIN, UPDATE_ALL_ROLES]),
  validators,
];

const select = [
  "id",
  "name",
  "level",
  "is_deletable",
  "is_removable",
  "created_at",
  "updated_at",
];

const updateRole = async (req, res, next) => {
  const altered = req.body.altered;

  console.log(req.body);

  const trx = await Roles.startTransaction();

  try {
    await Roles.updateRole(req.params.id, req.body, trx);
    await redis.del(`role_${req.params.id}`);
    await trx.commit();
  } catch (err) {
    console.log(err);
    await trx.rollback();
    return next(err);
  }

  if (altered) {
    const sessions = await getUserSessionsByRoleID(req.params.id);
    console.log(sessions);
    if (sessions && sessions.length) await redis.multi(sessions).exec();
  }

  const role = await Roles.query()
    .where("id", req.params.id)
    .select(select)
    .withGraphFetched("[policies, discord_roles]")
    .first();

  res.status(200).send(role);
};

module.exports = {
  path: "/:id",
  method: "PATCH",
  middleware,
  handler: updateRole,
};
