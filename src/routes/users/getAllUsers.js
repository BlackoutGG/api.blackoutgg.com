"use strict";
const User = require("./models/User");
const UserRole = require("./models/UserRole");

const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { buildQuery, validate } = require("$util");

const getAllUsers = async function (req, res, next) {
  // const filters = req.query.filters ? JSON.parse(req.query.filters) : null;

  console.log(req.query);

  let query = User.query()
    .select("id", "avatar", "username", "email", "created_at")
    .withGraphFetched("roles");

  // if (filters) {
  //   query = query.whereExists(
  //     User.relatedQuery("roles").whereIn("id", req.query.filters)
  //   );
  // }

  const users = await buildQuery(query, req.query.page, req.query.limit);

  res.status(200).send({ users });
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [
    guard.check("view:users"),
    validate([query("page").isNumeric(), query("limit").isNumeric()]),
  ],
  handler: getAllUsers,
};
