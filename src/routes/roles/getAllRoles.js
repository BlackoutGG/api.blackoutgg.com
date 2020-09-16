"use strict";
const Roles = require("./models/Roles.js");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { validate, buildQuery } = require("$util");

const getAllRoles = async function (req, res, next) {
  const query = Roles.query()
    .select("id", "name", "level", "created_at")
    .where("level", ">=", req.user.level);

  try {
    const roles = await buildQuery(query, req.query.page, req.query.limit);
    res.status(200).send({ roles });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [
    guard.check(["view:roles"]),
    validate([
      query("page").optional().isNumeric(),
      query("limit").optional().isNumeric(),
    ]),
  ],
  handler: getAllRoles,
};
