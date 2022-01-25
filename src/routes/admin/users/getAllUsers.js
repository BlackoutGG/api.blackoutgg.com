"use strict";
const User = require("$models/User");
const Roles = require("$models/Roles");
const Policies = require("$models/Policies");
const filterQuery = require("$util/filterQuery");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, VIEW_ALL_USERS } = require("$util/policies");

const columns = [
  "users.id",
  "avatar",
  "username",
  "email",
  "active",
  "created_at",
  "updated_at",
];

const getAllUsers = async function (req, res, next) {
  const filters = req.query.filters || null,
    nextCursor = req.query.nextCursor,
    isInitial = req.query.isInitial;

  const userQuery = filterQuery(
    User.query()
      .withGraphJoined("roles(nameAndId)")
      .orderBy("users.id")
      .select(columns)
      .limit(50),
    filters
  );

  let response = {};
  let query;

  if (isInitial) {
    const policyQuery = Policies.query().where("level", ">=", req.user.level);
    const roleQuery = Roles.query()
      .select("id", "name")
      .where("level", ">=", req.user.level);

    const [policies, roles] = await Promise.all([policyQuery, roleQuery]);

    Object.assign(response, { policies, roles });
  }

  if (nextCursor) query = await userQuery.clone().cursorPage(nextCursor);
  else query = await userQuery.clone().cursorPage();

  console.log(query);

  Object.assign(response, { users: query });

  res.status(200).send(response);
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [
    guard.check([VIEW_ALL_ADMIN, VIEW_ALL_USERS]),
    validate([
      query("nextCursor").optional().isString().escape().trim(),
      query("isInitial").isBoolean().default(false),
      query("limit").optional().isNumeric(),
    ]),
  ],
  handler: getAllUsers,
};
