"use strict";
const User = require("./models/User");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { buildQuery, validate } = require("$util");

const getAllUsers = async function (req, res, next) {
  const query = User.query()
    .select("id", "avatar", "username", "created_at")
    .withGraphFetched("roles");
  try {
    const users = await buildQuery.call(query, req.query.page, req.query.limit);

    users.results = users.results.map((user) => {
      return {
        id: user.id,
        avatar: user.avatar,
        username: user.username,
        roles: user.getRoles(),
        joined_on: user.created_at,
      };
    });

    res.status(200).send({ users });
  } catch (err) {
    next(new Error(err));
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
