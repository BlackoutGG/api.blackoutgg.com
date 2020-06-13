"use strict";
const User = require("./models/User");
const UserRole = require("./models/UserRole");
const guard = require("express-jwt-permissions")();
const { param, body } = require("express-validator");
const { validateRequest } = require("$util");

const changeUserGroup = async function (req, res, next) {
  try {
    const query = await User.transaction(async (trx) => {
      const user = await User.query(trx)
        .where("id", req.params.id)
        .first()
        .throwIfNotFound()
        .returning("id");

      const userGroup = await UserRole.query(trx)
        .patch({ group_id: req.body.groupId })
        .where("user_id", req.params.id)
        .first()
        .throwIfNotFound()
        .returning("*");

      return userGroup;
    });

    return res.status(200).send({ id: query.user_id, group: query.group_id });
  } catch (err) {
    next(new Error(err));
  }
};

module.exports = {
  path: "/:id/group",
  method: "PUT",
  middleware: [
    guard.check("user:edit"),
    param("id").isNumeric(),
    body("groupId").isNumeric(),
    validateRequest,
  ],
  handler: changeUserGroup,
};
