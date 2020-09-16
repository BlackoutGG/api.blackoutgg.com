"use strict";
const User = require("./models/User");
const UserRole = require("./models/UserRole");
const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate, buildQuery } = require("$util");

const middleware = [
  guard.check("delete:users"),
  validate([
    // body("ids").isNumeric(),
    body("page").optional().isNumeric(),
    body("limit").optional().isNumeric(),
  ]),
];

const removeUser = async function (req, res, next) {
  try {
    const users = await User.transaction(async (trx) => {
      await User.query(trx).whereIn("id", req.query.ids).delete();

      const results = await buildQuery(
        User.query(trx).withGraphFetched("roles(nameAndId)"),
        req.body.page,
        req.body.limit
      );

      return results;
    });

    res.status(200).send({ users });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/delete",
  method: "DELETE",
  middleware,
  handler: removeUser,
};
