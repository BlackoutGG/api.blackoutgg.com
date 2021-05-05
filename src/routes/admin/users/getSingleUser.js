"use strict";
const User = require("$models/User");
const guard = require("express-jwt-permissions")();
const { param } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, VIEW_ALL_USERS } = require("$util/permissions");

const columns = [
  "id",
  "username",
  "email",
  "avatar",
  "created_at",
  "updated_at",
];

const getSingleUser = async function (req, res, next) {
  const user = await User.query()
    .where("id", req.params.id)
    .withGraphFetched("roles(nameAndId)")
    .columns(columns)
    .first()
    .throwIfNotFound();

  res.status(200).send({ user });
};

module.exports = {
  path: "/:id",
  method: "GET",
  middleware: [
    guard.check([VIEW_ALL_ADMIN, VIEW_ALL_USERS]),
    validate([param("id").isNumeric().toInt(10)]),
  ],
  handler: getSingleUser,
};
