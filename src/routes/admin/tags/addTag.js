"use strict";
const Tag = require("$models/Tag");
const guard = require("express-jwt-permissions")();
const sanitize = require("sanitize-html");
const { body } = require("express-validator");
const { validate } = require("$util");
const { transaction } = require("objection");
const { VIEW_ALL_ADMIN, ADD_ALL_TAGS } = require("$util/policies");

const validators = validate([
  body("name")
    .isAlphanumeric()
    .escape()
    .trim()
    .customSanitizer((v) => sanitize(v)),
  body("color")
    .isString()
    .escape()
    .trim()
    .customSanitizer((v) => sanitize(v)),
]);

const addTag = async function (req, res, next) {
  const trx = await Tag.startTransaction();

  try {
    const inserted = await Tag.query(trx)
      .insert({ name: req.body.name })
      .returning("id");

    await trx.commit();

    const tag = await Tag.query().where("id", inserted.id).first();

    res.status(200).send(tag);
  } catch (err) {
    await trx.rollback();
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "POST",
  middleware: [
    (req, res, next) => {
      console.log(req.body);
      next();
    },
    guard.check([VIEW_ALL_ADMIN, ADD_ALL_TAGS]),
    validators,
  ],
  handler: addTag,
};
