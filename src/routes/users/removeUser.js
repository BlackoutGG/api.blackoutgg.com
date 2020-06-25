"use strict";
const User = require("./models/User");
const UserRole = require("./models/UserRole");
const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate, buildQuery } = require("$util");

const middleware = [
  guard.check("users:remove"),
  validate([
    body("ids").isNumeric(),
    body("page").optional().isNumeric(),
    body("limit").optional().isNumeric(),
  ]),
];

const del = (model, trx, ids) =>
  ids && Array.isArray(ids)
    ? model.query(trx).whereIn("id", ids).delete()
    : model.query(trx).where("id", ids).delete();

const removeUser = async function (req, res, next) {
  try {
    const users = await Roles.transaction(async (trx) => {
      await del(User, trx, req.body.ids);
      await del(UserRole, trx, req.body.ids);

      const u = await buildQuery.call(
        User.query(trx),
        req.body.page,
        req.body.limit
      );

      return u;
    });

    res.status(200).send({ users });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "DELETE",
  middleware,
  handler: removeUser,
};
