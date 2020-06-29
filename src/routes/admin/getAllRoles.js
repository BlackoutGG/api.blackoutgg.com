"use strict";
const Roles = require("$models/Roles");
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
  const roles = buildQuery.call(query, req.query.page, req.query.limit);
  const perms = Roles.getPerms();
  try {
    const [roles, perms] = await Promise.all([roles, perms]);
    // roles.map((role) => ({
    //   id: role.id,
    //   name: role.name,
    //   is_disabled: role.is_disabled,
    //   is_removable: role.is_removable,
    //   created_at: role.created_at,
    //   updated_at: role.updated_at,
    //   permissions: role.permissions,
    // }));
    res.status(200).send({ roles, perms });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/roles",
  method: "GET",
  middleware: [
    guard.check("roles:view"),
    validate([query("page").isNumeric(), query("limit").isNumeric()]),
  ],
  handler: getAllRoles,
};
