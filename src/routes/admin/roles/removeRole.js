"use strict";
const Roles = require("./models/Roles");
const User = require("$models/User");
const guard = require("express-jwt-permissions")();
const isFuture = require("date-fns/isFuture");
const diffInSeconds = require("date-fns/differenceInSeconds");
const { query } = require("express-validator");
const { validate, buildQuery } = require("$util");
const { transaction, raw } = require("objection");
const { VIEW_ALL_ADMIN, REMOVE_ALL_ROLES } = require("$util/permissions");

const middleware = [
  guard.check([VIEW_ALL_ADMIN, REMOVE_ALL_ROLES]),
  validate([
    query("ids.*").isNumeric(),
    query("page").optional().isNumeric(),
    query("limit").optional().isNumeric(),
  ]),
];

const filterExpressions = (ids) => {
  const keys = ids.reduce((output, id) => {
    output[`:role${id}`] = id;
  }, {});

  return `roles IN (${Object.keys(keys).toString()})`;
};

const expressionAttributeValues = (ids) => {
  return ids.reduce((output, id) => {
    output[`:role${id}`] = id;
    return output;
  }, {});
};

const removeRole = async function (req, res, next) {
  const trx = await Roles.startTransaction();

  try {
    await Roles.query(trx).whereIn("in", req.query.ids).delete();

    const roles = await buildQuery(
      Roles.query(trx),
      req.body.page,
      req.body.limit
    );

    const sessions = await UserSession.query()
      .joinRelated("user.roles")
      .whereIn("user:roles.id", req.params.ids)
      .whereRaw(raw("expires >= CURRENT_TIMESTAMP"))
      .select(["user_sessions.token_id", "expires"])
      .groupBy("user_sessions.token_id")
      .orderBy("user_sessions.created_at", "DESC")
      .distinctOn("user_sessions.token_id");

    if (sessions && sessions.length) {
      console.log(sessions);

      const commands = sessions.reduce((output, s) => {
        const timestamp = s.expires;

        if (isFuture(timestamp)) {
          const diff = diffInSeconds(timestamp, new Date());
          const id = s.token_id;
          const key = `blacklist:${id}`;
          output.push(["set", key, id, "NX", "EX", diff]);
        }
        return output;
      }, []);

      await req.redis.multi(commands).exec();
    }

    await trx.commit();

    res.status(200).send(roles);
  } catch (err) {
    console.log(err);
    await trx.rollback();
    next(err);
  }
};

// const removeRole = async function (req, res, next) {
//   const items = await Roles.transaction(async (trx) => {
//     await Roles.query(trx).whereIn("id", req.query.ids).delete();

//     const tokens = await User.query(trx)
//       .joinRelated("roles")
//       .withGraphJoined("session(selectByCreated)")
//       .select("session.*")
//       .whereIn("roles.id", req.query.ids)
//       .distinct();

// const results = await buildQuery(
//   Roles.query(trx),
//   req.body.page,
//   req.body.limit
// );

//     return { results, tokens };
//   });

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

//   res.status(200).send({ roles: items.results });
// };

module.exports = {
  path: "/",
  method: "DELETE",
  middleware,
  handler: removeRole,
};
