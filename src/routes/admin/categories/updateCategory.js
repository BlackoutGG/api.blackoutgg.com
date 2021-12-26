"use strict";
const Category = require("$models/Category");
const guard = require("express-jwt-permissions")();
const sanitize = require("sanitize-html");
const redis = require("$services/redis");
const { body, param } = require("express-validator");
const { validate } = require("$util");
const { transaction } = require("objection");
const { VIEW_ALL_ADMIN } = require("$util/policies");

const validators = validate([
  body("details.name")
    .optional()
    .isString()
    .escape()
    .trim()
    .customSanitizer((v) => sanitize(v)),
  body("details.enable_recruitment").optional().isBoolean(),
  param("id").isNumeric().toInt(10),
]);

const editCategory = async function (req, res, next) {
  const trx = await Category.startTransaction();

  try {
    const category = await Category.query(trx)
      .patch(req.body.details)
      .where("id", req.params.id)
      .first()
      .returning("id", "name", "updated_at");

    await redis.del(`r_form_${req.params.id}`);
    await redis.del("categories");
    await redis.del("recruit_categories");
    await trx.commit();
    res.status(200).send(category);
  } catch (err) {
    console.error(err);

    await trx.rollback();
    next(err);
  }
};

module.exports = {
  path: "/:id",
  method: "PATCH",
  middleware: [guard.check(VIEW_ALL_ADMIN), validators],
  handler: editCategory,
};
