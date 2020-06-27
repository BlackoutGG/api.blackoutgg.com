"use strict";
const Role = require("./models/Roles");
const guard = require("express-jwt-permissions")();
const { param } = require("express-validator");
const { validate } = require("$util");
const columns = require("$util/permissions");

const getRolePermissions = async function (req, res, next) {
  try {
    const permissions = await Role.getAndFormatPerms(req.params.id);
    res.status(200).send({ permissions });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/perms/:id",
  method: "GET",
  middleware: [guard.check("roles:view"), validate([param("id").isNumeric()])],
  handler: getRolePermissions,
};
