"use strict";
const Category = require("$models/Category");
const guard = require("express-jwt-permissions")();
const redis = require("$services/redis");
const { query, param } = require("express-validator");
const { validate } = require("$util");
const { transaction } = require("objection");
const { VIEW_ALL_ADMIN } = require("$util/policies");

const validators = validate([query("ids.*").isNumeric().toInt(10)]);

const removeCategory = async function (req, res, next) {
  const trx = await Category.startTransaction();

  try {
    const deleted = await Category.query(trx)
      .whereIn("id", req.query.ids)
      .delete()
      .returning("id");

    const pipeline = redis.pipeline();
    req.query.ids.forEach((id) => pipeline.del(`r_form_${id}`));
    pipeline.del("categories");
    pipeline.del("recruit_categories");
    pipeline.exec();

    res.status(200).send(deleted);
  } catch (err) {
    await trx.rollback();
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "DELETE",
  middleware: [guard.check([VIEW_ALL_ADMIN]), validators],
  handler: removeCategory,
};
