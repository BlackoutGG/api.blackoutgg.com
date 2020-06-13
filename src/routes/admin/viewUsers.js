"use strict";
const guard = require("express-jwt-permissions")();
const Roles = require("$models/Roles");
const User = require("$models/User");
const { buildQuery, validate } = require("$util");
const { query } = require("express-validator");

const viewUsers = async function (req, res, next) {
  const userQuery = User.query()
    .select("id", "avatar", "username", "email", "created_at")
    .withGraphFetched("roles");
  const roleQuery = Roles.query().select("id", "name");
  const query = buildQuery.call(userQuery, req.query.page, req.query.limit);

  try {
    const [users, roles] = await Promise.all([query, roleQuery]);

    users.results = users.results.map((user) => {
      return {
        id: user.id,
        avatar: user.avatar,
        username: user.username,
        email: user.email,
        roles: user.getRoles(),
        joined_on: user.created_at,
      };
    });

    res.status(200).send({ users, roles });
  } catch (err) {
    next(new Error(err));
  }
};

module.exports = {
  path: "/users",
  method: "GET",
  middleware: [
    guard.check("users:view"),
    validate([query("page").isNumeric(), query("limit").isNumeric()]),
  ],
  handler: viewUsers,
};
