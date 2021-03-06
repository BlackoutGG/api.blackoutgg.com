"use strict";
const Roles = require("./models/Roles");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { validate, buildQuery } = require("$util");

const getAllRoles = async function (req, res) {
  const query = Roles.query().select(
    "id",
    "name",
    "is_disabled",
    "is_removable",
    "created_at"
  );
  // const query = Roles.query();
  try {
    const roles = await buildQuery.call(query, req.query.page, req.query.limit);
    // roles.map((role) => ({
    //   id: role.id,
    //   name: role.name,
    //   is_disabled: role.is_disabled,
    //   is_removable: role.is_removable,
    //   created_at: role.created_at,
    //   updated_at: role.updated_at,
    //   permissions: role.permissions,
    // }));
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
    guard.check("roles:view"),
    validate([query("page").isNumeric(), query("limit").isNumeric()]),
  ],
  handler: getAllRoles,
};
