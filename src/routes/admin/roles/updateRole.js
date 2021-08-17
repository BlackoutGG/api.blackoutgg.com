"use strict";
const isFuture = require("date-fns/isFuture");
const Roles = require("./models/Roles");
const UserSession = require("$models/UserSession");
const guard = require("express-jwt-permissions")();
const sanitize = require("sanitize-html");
const redis = require("$services/redis");
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
  body("altered").default(false).isBoolean(),
]);

const middleware = [
  guard.check([VIEW_ALL_ADMIN, UPDATE_ALL_ROLES]),
  validators,
];

const graphFn = (id, details, policies) => {
  const data = { id };

  if (details && Object.keys(details)) {
    Object.assign(data, details);
  }

  Object.assign(data, {
    policies: policies.map((p) => ({
      id: p,
    })),
  });

  return data;
};

const updateRole = async (req, res, next) => {
  const details = req.body.details,
    altered = req.body.altered,
    policies = req.body.policies;

  const trx = await Roles.startTransaction();

  try {
    await Roles.query(trx).upsertGraph(
      graphFn(req.params.id, details, policies),
      { relate: true, unrelate: true, noDelete: true }
    );

    if (altered) {
      const sessions = await UserSession.query()
        .joinRelated("user.roles")
        .where("user:roles.id", req.params.id)
        .whereRaw(raw("expires >= CURRENT_TIMESTAMP"))
        .select(["user_sessions.refresh_token_id", "expires"])
        .orderBy("user_sessions.created_at", "DESC");

      // .distinctOn("user_sessions.user_id");

      if (sessions && sessions.length) {
        console.log(sessions);

        const commands = sessions.reduce((output, s) => {
          const timestamp = s.expires;
          if (isFuture(timestamp)) {
            const diff = diffInSeconds(timestamp, new Date());
            const id = s.refresh_token_id;
            const key = `blacklist:${id}`;
            output.push(["set", key, id, "NX", "EX", diff]);
          }
          return output;
        }, []);

        await redis.multi(commands).exec();
      }
    }
    await trx.commit();
    res.status(200).send();
  } catch (err) {
    console.log(err);
    await trx.rollback();
    next(err);
  }
};

// const updateRole = async (req, res, next) => {
//   const details = req.body.details || null,
//     remove = req.body.remove || null,
//     added = req.body.added || null;

//   console.log(req.body);

//   const results = await Roles.transaction(async (trx) => {
//     let toUpdate = {},
//       tokens;

//     if (remove && remove.length) {
//       await RolePermissions.query(trx)
//         .whereIn("perm_id", remove)
//         .andWhere("role_id", req.params.id)
//         .delete();
//     }

//     if (added && added.length) {
//       const insert = added.map((perm_id) => ({
//         role_id: req.params.id,
//         perm_id,
//       }));

//       await RolePermissions.query(trx).insert(insert).returning("*");
//     }

//     if ((added && added.length) || (remove && remove.length)) {
//       // tokens = await User.query()
//       //   .joinRelated("roles")
//       //   .withGraphJoined("session(selectByCreated)")
//       //   .select("session.*")
//       //   .where("roles.id", req.params.id)
//       //   .whereNotNull("session.token_id");

//       tokens = await UserSession.query()
//         .joinRelated("user.roles")
//         .where("user:roles.id", req.params.id)
//         .whereNotNull("user_sessions.token_id")
//         .select(["user_sessions.token_id", "expires_on"])
//         .orderBy("user_sessions.created_at", "DESC")
//         .distinct();

//       console.log(tokens);
//     }

//     if (details && Object.keys(details).length) {
//       Object.assign(toUpdate, details);
//     }

//     const _details = await Roles.query(trx)
//       .patch({ updated_at: new Date().toISOString(), ...toUpdate })
//       .where("id", req.params.id)
//       .first()
//       .returning(["id", "name", "level", "created_at", "updated_at"]);

//     return { details: _details, tokens };
//   });

//   /**
//    * If a permission changes on a role, we pull all the users with that role
//    * and revoke their tokens.
//    */
//   if (results.tokens && results.tokens.length) {
//     console.log(results.tokens);

//     const commands = results.tokens.reduce((output, t) => {
//       const timestamp = new Date(t.expires_on);
//       if (isFuture(timestamp)) {
//         output.push([
//           "set",
//           `blacklist:${t.token_id}`,
//           t.token_id,
//           "NX",
//           "EX",
//           diffInSeconds(timestamp, Date.now()),
//         ]);
//       }
//       return output;
//     }, []);

//     await req.redis.multi(commands).exec();
//   }

//   res.status(200).send(results.details);
// };

module.exports = {
  path: "/:id",
  method: "PATCH",
  middleware,
  handler: updateRole,
};
