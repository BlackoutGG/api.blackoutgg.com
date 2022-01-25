"use strict";
const Tag = require("$models/Tag");
const guard = require("express-jwt-permissions")();
const sanitize = require("sanitize-html");
const { body, param } = require("express-validator");
const { validate } = require("$util");
const { transaction } = require("objection");
const { VIEW_ALL_ADMIN, UPDATE_ALL_TAGS } = require("$util/policies");

const validators = validate([
  body("details.name")
    .optional()
    .isString()
    .escape()
    .trim()
    .customSanitizer((v) => sanitize(v)),
  body("details.color")
    .optional()
    .isString()
    .escape()
    .trim()
    .customSanitizer((v) => sanitize(v)),
  param("id").isNumeric().toInt(10),
]);

const editTag = async function (req, res, next) {
  const trx = await Tag.startTransaction();

  try {
    const tag = await Tag.query(trx)
      .patch(req.body.details)
      .where("id", req.params.id)
      .first()
      .returning("id", "name", "updated_at");

    await trx.commit();
    res.status(200).send(tag);
  } catch (err) {
    console.error(err);

    await trx.rollback();
    next(err);
  }
};

module.exports = {
  path: "/:id",
  method: "PATCH",
  middleware: [guard.check([VIEW_ALL_ADMIN, UPDATE_ALL_TAGS]), validators],
  handler: editTag,
};
