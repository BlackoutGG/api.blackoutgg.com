"use strict";
const User = require("$models/User");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { validate, buildQuery } = require("$util");
const { VIEW_ALL_ADMIN, DELETE_ALL_USERS } = require("$util/policies");

const columns = ["id", "avatar", "username", "email", "created_at"];

const middleware = [
  guard.check([VIEW_ALL_ADMIN, DELETE_ALL_USERS]),
  validate([
    query("ids.*").isNumeric(),
    query("page").optional().isNumeric().toInt(10),
    query("limit").optional().isNumeric().toInt(10),
  ]),
];

const removeUser = async function (req, res, next) {
  console.log(req.query);

  const filters = req.query.filters || null;

  const users = await User.transaction(async (trx) => {
    await User.query(trx).whereIn("id", req.query.ids).delete();

    let query = User.query(trx)
      .select(columns)
      .withGraphFetched("roles(nameAndId)");

    if (filters && Object.keys(filters).length) {
      query = query.whereExists(
        User.relatedQuery("roles").whereIn("id", filters.id)
      );
    }

    const results = await buildQuery(query, req.query.page, req.query.limit);

    return results;
  });

  console.log(users);

  res.status(200).send({ users });
};

module.exports = {
  path: "/",
  method: "DELETE",
  middleware,
  handler: removeUser,
};
