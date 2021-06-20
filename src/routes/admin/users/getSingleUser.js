"use strict";
const User = require("$models/User");
const Policies = require("$models/Policies");
const guard = require("express-jwt-permissions")();
const { param } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, VIEW_ALL_USERS } = require("$util/permissions");

const columns = [
  "id",
  "username",
  "email",
  "avatar",
  "active",
  "created_at",
  "updated_at",
];

const getSingleUser = async function (req, res, next) {
  const user = User.query()
    .where("id", req.params.id)
    .withGraphFetched("[roles(nameAndId), policies]")
    .columns(columns)
    .first()
    .throwIfNotFound();

  const _policies = await Policies.query().where("level", ">=", req.user.level);

  const [u, p] = await Promise.all([user, _policies]);

  res.status(200).send({ user: u, basePolicies: p });
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
