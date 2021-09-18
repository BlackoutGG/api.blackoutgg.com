"use strict";
const Roles = require("./models/Roles.js");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { validate, buildQuery } = require("$util");
const { VIEW_ALL_ADMIN, VIEW_ALL_ROLES } = require("$util/policies");

const getAllRoles = async function (req, res, next) {
  const query = Roles.query()
    .select(
      "id",
      "name",
      "level",
      "is_deletable",
      "is_removable",
      "created_at",
      "updated_at"
    )
    .where("level", ">=", req.user.level);

  const roles = await buildQuery(query, req.query.page, req.query.limit);
  res.status(200).send(roles);
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [
    guard.check([VIEW_ALL_ADMIN, VIEW_ALL_ROLES]),
    validate([
      query("page").optional().isNumeric(),
      query("limit").optional().isNumeric(),
    ]),
  ],
  handler: getAllRoles,
};
