"use strict";
const Roles = require("./models/Roles");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { validate, buildQuery } = require("$util");

const getAllRoles = async function (req, res) {
  const query = Roles.query().select(
    "id",
    "name",
    "default",
    "is_disabled",
    "is_removable",
    "created_at"
  );

  try {
    const [roles, perms] = await Promise.all([
      buildQuery.call(query, req.query.page, req.query.limit),
      Roles.getPermList(),
    ]);

    console.log(roles);
    console.log(perms);
    res.status(200).send({ roles, perms });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [
    guard.check("roles:view"),
    validate([query("page").isNumeric(), query("limit").isNumeric()]),
  ],
  handler: getAllRoles,
};
