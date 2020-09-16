"use strict";
const User = require("./models/User");
const UserRole = require("./models/UserRole");
const guard = require("express-jwt-permissions")();
const { param, body } = require("express-validator");
const { validate } = require("$util");

const changeUserRole = async function (req, res, next) {
  try {
    // const query = await User.transaction(async (trx) => {
    //   const user = await User.query(trx)
    //     .where("id", req.params.id)
    //     .first()
    //     .throwIfNotFound()
    //     .returning("id");

    //   return userGroup;
    // });

    const userGroup = await UserRole.query(trx)
      .patch({ group_id: req.body.groupId })
      .where("user_id", req.params.id)
      .first()
      .throwIfNotFound()
      .returning("*");

    return res.status(200).send({ id: query.user_id, group: query.group_id });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/:id/group",
  method: "PUT",
  middleware: [
    guard.check("edit:users"),
    validate([param("id").isNumeric(), body("groupId").isNumeric()]),
  ],
  handler: changeUserRole,
};
