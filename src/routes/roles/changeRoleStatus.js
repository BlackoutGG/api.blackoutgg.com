"use strict";
const Roles = require("./models/Roles");
const guard = require("express-jwt-permissions")();
const { param, body } = require("express-validator");
const { validate } = require("$util");
const createError = require("http-errors");

const changeRoleStatus = async function (req, res) {
  try {
    const results = await Roles.query()
      .patch({ is_disabled: req.body.disable })
      .where("id", req.params.id)
      .first()
      .throwIfNotFound()
      .returning(["id", "is_disabled"]);

    const role = { id: results.id, disabled: results.is_disabled };
    res.status(200).send({ role });
  } catch (err) {
    if (err.name && err.name === "NotFoundError") {
      return next(new createError.notFound("Role doesn't exist."));
    }
    next(new Error(err));
  }
};

module.exports = {
  path: "/:id/status",
  method: "PUT",
  middleware: [
    guard.check("roles:edit"),
    validate([param("id").isNumeric(), body("disable").isBoolean()]),
  ],
  handler: changeRoleStatus,
};
