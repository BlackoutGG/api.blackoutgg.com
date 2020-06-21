"use strict";
const Role = require("./models/Roles");
const guard = require("express-jwt-permissions")();
const { param } = require("express-validator");
const { validate } = require("$util");

const getRolePermissions = async function (req, res, next) {
  try {
    const result = await Role.query().where("id", 1).first();

    const columns = Object.keys(result).filter((key) => /^can_/.test(key));

    const permissions = await Role.query()
      .where("id", req.params.id)
      .columns(columns)
      .first();

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
