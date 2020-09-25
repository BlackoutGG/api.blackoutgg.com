"use strict";
const Roles = require("./models/Roles");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { validate, buildQuery } = require("$util");

const middleware = [
  guard.check("delete:roles"),
  validate([
    query("ids.*").isNumeric(),
    query("page").optional().isNumeric(),
    query("limit").optional().isNumeric(),
  ]),
];

const removeRole = async function (req, res, next) {
  try {
    const roles = await Roles.transaction(async (trx) => {
      await Roles.query(trx).whereIn("id", req.query.ids).delete();

      const results = await buildQuery(
        Roles.query(trx),
        req.body.page,
        req.body.limit
      );

      return results;
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
