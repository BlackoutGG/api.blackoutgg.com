"use strict";
const Role = require("./models/Roles");
const guard = require("express-jwt-permissions")();
const { param } = require("express-validator");
const { validate } = require("$util");

const getRolePermissions = async function (req, res, next) {
  try {
    const perm = Role.query()
      .where("id", req.params.id)
      .select("permissions")
      .first();
    res.status(200).send({ perm });
  } catch (err) {
    next(new Error(err));
  }
};

module.exports = {
  path: "/:id/perms",
  method: "GET",
  middleware: [guard.check("roles:view"), validate([param("id").isNumeric()])],
  handler: getRolePermissions,
};
