"use strict";
const Roles = require("./models/Roles");
const UserRole = require("$models/UserRole");
const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate, buildQuery } = require("$util");

const middleware = [
  guard.check("roles:remove"),
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

const removeRole = async function (req, res, next) {
  try {
    const roles = await Roles.transaction(async (trx) => {
      await del(Roles, trx, req.body.ids);
      await del(UserRole, trx, req.body.ids);

      const r = await buildQuery.call(
        Roles.query(trx),
        req.body.page,
        req.body.limit
      );

      return r;
    });

    res.status(200).send({ roles });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "DELETE",
  middleware,
  handler: removeRole,
};
