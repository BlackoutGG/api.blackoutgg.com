"use strict";
const User = require("./models/User");
const guard = require("express-jwt-permissions")();
const { param } = require("express-validator");
const { validate } = require("$util");

const getSingleUser = async function (req, res, next) {
  try {
    const data = await User.query()
      .withGraphFetched("roles")
      .where("id", req.params.id)
      .first()
      .throwIfNotFound();

    const user = {
      id: data.id,
      username: data.username,
      roles: user.getRoles(),
      scope: user.getScope(),
      is_disabled: data.is_disabled,
    };

    res.status(200).send({ user });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/:id",
  method: "GET",
  middleware: [guard.check("users:view"), validate([param("id").isNumeric()])],
  handler: getSingleUser,
};
