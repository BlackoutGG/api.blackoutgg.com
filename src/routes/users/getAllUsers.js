"use strict";
const User = require("./models/User");
const UserRole = require("./models/UserRole");

const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { buildQuery, validate } = require("$util");

const getAllUsers = async function (req, res, next) {
  const filters = req.query.filters ? JSON.parse(req.query.filters) : null;
  let query = User.query();

  // if (filters) {
  //   query = UserRole.query()
  //     .joinRelated("user")
  //     .withGraphFetched("roles(nameAndId)")
  //     .distinct()
  //     .select(
  //       "users.id",
  //       "users.username",
  //       "users.avatar",
  //       "users.email",
  //       "users.created_at"
  //     );
  //     .whereIn("role_id", filter["roles.id"])
  // } else {
  //   query = User.query()
  //     .select("id", "avatar", "username", "email", "created_at")
  //     .withGraphFetched("roles(nameAndId)");
  // }

  if (filters) {
    Object.entries(filters).forEach(([key, val]) => {
      query = Array.isArray(val)
        ? (query = query
            .joinRelated("roles")
            .select(
              "users.id",
              "users.username",
              "users.avatar",
              "users.email",
              "users.created_at"
            )
            .withGraphFetched("roles(nameAndId)")
            .distinctOn("id")
            .whereIn(key, val))
        : query.where(key, val);
    });
  } else {
    query = query
      .withGraphFetched("roles")
      .select("id", "avatar", "username", "email", "created_at");
  }

  // const query = User.query()
  //   .select("id", "avatar", "username", "email", "created_at")
  //   .withGraphFetched("roles");

  try {
    const users = await buildQuery.call(query, req.query.page, req.query.limit);

    // users.results = users.results.map((user) => {
    //   return {
    //     id: user.id,
    //     avatar: user.avatar,
    //     username: user.username,
    //     email: user.email,
    //     roles: user.getRoles(),
    //     joined_on: user.created_at,
    //   };
    // });
    res.status(200).send({ users });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [
    guard.check("users:view"),
    validate([query("page").isNumeric(), query("limit").isNumeric()]),
  ],
  handler: getAllUsers,
};
