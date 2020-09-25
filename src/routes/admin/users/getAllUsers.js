"use strict";
const User = require("$models/User");
const Roles = require("$models/Roles");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { buildQuery, validate } = require("$util");

const getAllUsersForAdmin = async function (req, res, next) {
  const filters = req.query.filters ? JSON.parse(req.query.filters) : null;
  let query = User.query();

  // if (filters) {
  //   Object.entries(filters).forEach(([key, val]) => {
  //     query = Array.isArray(val)
  //       ? (query = query
  //           // .joinRelated("roles")
  //           .select(
  //             "users.id",
  //             "users.username",
  //             "users.avatar",
  //             "users.email",
  //             "users.created_at"
  //           )
  //           .withGraphJoined("roles(nameAndId)")
  //           .distinctOn("id")
  //           .whereIn(key, val))
  //       : query.where(key, val);
  //   });
  // } else {
  //   query = query
  //     .withGraphFetched("roles(nameAndId)")
  //     .select("id", "avatar", "username", "email", "created_at");
  // }

  query = query
    .withGraphFetched("roles(nameAndId)")
    .orderBy("id")
    .select("id", "avatar", "username", "email", "created_at");

  try {
    const [users, roles] = await Promise.all([
      buildQuery(query, req.query.page, req.query.limit),
      req.query.roles
        ? Roles.query()
            .select("id", "name")
            .where("level", ">=", req.user.level)
        : Promise.resolve(null),
    ]);

    res.status(200).send({ users, roles });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [
    guard.check(["view:admin", "view:users"]),
    validate([
      query("page").optional().isNumeric(),
      query("limit").optional().isNumeric(),
    ]),
  ],
  handler: getAllUsersForAdmin,
};
