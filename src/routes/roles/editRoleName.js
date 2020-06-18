"use strict";
const Roles = require("./models/Roles");
const guard = require("express-jwt-permissions")();
const { param, body } = require("express-validator");
const { validateRequest } = require("$util");

const editGroupName = async function (req, res) {
  try {
    const role = await Roles.query()
      .patch({ name: req.body.name })
      .where("id", req.params.id)
      .first()
      .throwIfNotFound()
      .returning(["id", "name"]);
    res.status(200).send({ role });
  } catch (err) {
    next(new Error(err));
  }
};

module.exports = {
  path: "/:id/name",
  method: "PUT",
  middleware: [
    guard.check("roles:edit"),
    param("id").isNumeric(),
    body("name").notEmpty().isAlphanumeric().trim().escape(),
    validateRequest,
  ],
  handler: editGroupName,
};
