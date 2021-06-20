"use strict";
const User = require("$models/User");
const UserSession = require("$models/UserSession");
const sanitize = require("sanitize-html");
const guard = require("express-jwt-permissions")();
const AWS = require("aws-sdk");
const { body, param } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, UPDATE_ALL_USERS } = require("$util/permissions");
const { transaction } = require("objection");
const { isFuture, differenceInSeconds } = require("date-fns");
const { raw } = require("express");

const docClient = new AWS.DynamoDB.DocumentClient();

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

  const r = req.redis;

  const options = { relate: true, unrelate: true };

  const trx = await User.startTransaction();

  try {
    await User.query(trx).upsertGraph(
      graphFn(req.params.id, details, roles, policies),
      options
    );

    if (altered) {
      const sessions = await UserSession.query()
        .where("user_id", userId)
        .whereRaw(raw("expires >= CURRENT_TIMESTAMP"))
        .select("token_id", "expires")
        .orderBy("created_at", "DESC");

      if (sessions && sessions.length) {
        const commands = sessions.reduce((output, s) => {
          const date = s.expires;
          const id = s.token_id;
          const key = `blacklist:${id}`;
          if (isFuture(date)) {
            const diff = diffInSeconds(date, new Date());
            output.push(["set", key, id, "NX", "EX", diff]);
          }
          return output;
        }, []);

        await req.redis.multi(commands).exec();
      }
    }

    await trx.commit();

    res.status(200).send(results);
  } catch (err) {
    await trx.rollback();
    console.log(err);
    next(err);
  }
};

// const updateUser = async function (req, res, next) {
//   console.log(req.body);

//   const remove = req.body.remove || null,
//     added = req.body.added || null,
//     details = req.body.details || null;

//   const user = await User.transaction(async (trx) => {
//     if (details && Object.keys(details).length) {
//       await User.query(trx).where("id", req.params.id).patch(details).first();
//     }

//     if (remove && remove.length) {
//       await UserRole.query(trx)
//         .delete()
//         .where("user_id", req.params.id)
//         .whereIn("role_id", remove);
//     }

//     if (added && added.length) {
//       const roles = added.map((role) => ({
//         user_id: req.params.id,
//         role_id: role,
//       }));

//       await UserRole.query(trx).insert(roles).returning("*");
//     }

//     const results = await User.query(trx)
//       .where("id", req.params.id)
//       .withGraphFetched("roles(nameAndId)")
//       .first()
//       .columns(columns);

//     return results;
//   });

//   res.status(200).send({ user });
// };

module.exports = {
  path: "/:id",
  method: "PATCH",
  middleware: [guard.check([VIEW_ALL_ADMIN, UPDATE_ALL_USERS]), validators],
  handler: updateUser,
};
