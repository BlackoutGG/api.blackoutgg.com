"use strict";
const User = require("./models/User");
const guard = require("express-jwt-permissions")();
const { body, param } = require("express-validator");
const { validateRequest } = require("$util");

const changeUserStatus = async function (req, res, next) {
  try {
    const results = await User.query()
      .patch({ is_disabled: req.body.disable })
      .where("id", req.params.id)
      .first()
      .throwIfNotFound()
      .returning(["id", "is_disabled"]);

    const user = { id: results.id, disabled: results.is_disabled };
    res.status(200).send({ user });
  } catch (err) {
    next(new Error(err));
  }
};

module.exports = {
  path: "/:id/status",
  method: "PUT",
  middleware: [
    guard.check("users:disable"),
    param("id").isNumeric(),
    body("disable").isBoolean(),
    validateRequest,
  ],
  handler: changeUserStatus,
};
