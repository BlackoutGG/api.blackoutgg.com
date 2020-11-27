"use strict";
const Roles = require("./models/Roles");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { validate, buildQuery } = require("$util");

const middleware = [
  guard.check("delete:roles"),
  validate([
    query("ids.*").isNumeric(),
    query("page").optional().isNumeric(),
    query("limit").optional().isNumeric(),
  ]),
];

const removeRole = async function (req, res, next) {
  try {
    const items = await Roles.transaction(async (trx) => {
      await Roles.query(trx).whereIn("id", req.query.ids).delete();

      const tokenIDs = await User.query(trx)
        .joinRelated("roles")
        .select("token_id")
        .whereIn("roles.id", req.query.ids)
        .distinct();

      const results = await buildQuery(
        Roles.query(trx),
        req.body.page,
        req.body.limit
      );

      return { results, tokenIDs };
    });

    if (items.tokenIDs && items.tokenIDs.length) {
      let blacklist;

      const stream = req.redis.scanStream({ match: "blacklist:*", count: 100 });

      stream.on("data", (keys) => {
        const ids = items.tokenIDs.map((id) => `blacklist:${id}`);
        blacklist = keys.reduce((output, key) => {
          if (!ids.includes(key)) {
            output.push(key);
          }
          return output;
        }, []);
      });

      stream.on("end", async () => {
        if (blacklist && blacklist.length) {
          const setCommands = blacklist.map((key) => {
            return ["set", key, key, "EX", 60 * 60 * 24];
          });

          await req.redis.multi(setCommands).exec();
        }
      });
    }

    res.status(200).send({ roles: roles.results });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "DELETE",
  middleware,
  handler: removeRole,
};
