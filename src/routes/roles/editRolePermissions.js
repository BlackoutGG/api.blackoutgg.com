"use strict";
const Roles = require("./models/Roles");
const createError = require("http-errors");
const guard = require("express-jwt-permissions")();
const { param, body } = require("express-validator");
const { validate } = require("$util");

const isObject = (val) =>
  val && typeof val === "object" && val.constructor === Object;

const middleware = [
  guard.check("roles:edit"),
  validate([
    param("id").isNumeric(),
    body("permissions").custom((value) => {
      if (!isObject(value)) return false;
      return Object.keys(value).every((key) => typeof value[key] === "boolean");
    }),
  ]),
];

const editRolePermissions = async function (req, res) {
  try {
    const group = await Roles.query()
      .patch(req.body.permissions)
      .where("id", req.params.id)
      .first()
      .throwIfNotFound()
      .returning("*");

    res.status(200).send({ group });
  } catch (err) {
    if (err.name && err.name === "NotFoundError") {
      return next(createError("404", "Role doesn't exist."));
    }
    next(new Error(err));
  }
};

module.exports = {
  path: "/:id",
  method: "PUT",
  middleware,
  handler: editRolePermissions,
};
