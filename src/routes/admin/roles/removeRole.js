"use strict";
const Roles = require("./models/Roles");
const User = require("$models/User");
const guard = require("express-jwt-permissions")();
const isBefore = require("date-fns/isBefore");
const diffInSeconds = require("date-fns/differenceInSeconds");
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
  const items = await Roles.transaction(async (trx) => {
    await Roles.query(trx).whereIn("id", req.query.ids).delete();

    const tokens = await User.query(trx)
      .joinRelated("roles")
      .withGraphJoined("session(selectByCreated)")
      .select("session.*")
      .whereIn("roles.id", req.query.ids)
      .distinct();

    const results = await buildQuery(
      Roles.query(trx),
      req.body.page,
      req.body.limit
    );

    return { results, tokens };
  });

  if (items.tokens && items.tokens.length) {
    let blacklist = [];

    const stream = req.redis.scanStream({ match: "blacklist:*", count: 100 });

    stream.on("data", (keys) => {
      blacklist = items.tokens.reduce((output, info) => {
        //turn seconds into milliseconds for a comparison.
        const timestamp = new Date(info.expire_on);

        if (isBefore(Date.now(), timestamp)) {
          if (!keys.include(`blacklist:${info.token_id}`)) {
            output.push(info);
          }
        }
        return output;
      }, []);
    });

    stream.on("end", async () => {
      if (blacklist && blacklist.length) {
        const setCommands = blacklist.map((info) => {
          //turn seconds into milliseconds for a comparison.
          const timestamp = new Date(info.expire_on);

          return [
            "set",
            `blacklist:${info.token_id}`,
            `blacklist:${info.token_id}`,
            "EX",
            diffInSeconds(Date.now(), timestamp),
          ];
        });

        await req.redis.multi(setCommands).exec();
      }
    });
  }

  res.status(200).send({ roles: items.results });
};

module.exports = {
  path: "/",
  method: "DELETE",
  middleware,
  handler: removeRole,
};
