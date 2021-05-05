"use strict";
const Category = require("$models/Category");
const guard = require("express-jwt-permissions")();
const { query, param } = require("express-validator");
const { validate, buildQuery } = require("$util");

const validators = validate([
  query("ids").custom((v) => Array.isArray(v)),
  query("ids.*").isNumeric().toInt(10),
  query("page").isNumeric(),
  query("limit").isNumeric(),
]);

const removeCategory = async function (req, res, next) {
  const categories = await Category.transaction(async (trx) => {
    await Category.query(trx).whereIn("id", req.query.ids).delete();

    const results = buildQuery(
      Category.query(trx),
      req.query.page,
      req.query.limit
    );

    return results;
  });

  res.status(200).send({ categories });
};

module.exports = {
  path: "/",
  method: "DELETE",
  middleware: [guard.check("view:admin"), validators],
  handler: removeCategory,
};
