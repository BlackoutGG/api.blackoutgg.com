"use strict";
const Category = require("$models/Category");
const guard = require("express-jwt-permissions")();
const sanitize = require("sanitize-html");
const redis = require("$services/redis");
const { body } = require("express-validator");
const { validate } = require("$util");
const { transaction } = require("objection");

const validators = validate([
  body("name")
    .isAlphanumeric()
    .escape()
    .trim()
    .customSanitizer((v) => sanitize(v)),
  body("nextCursor").isString().escape().trim(),
]);

const addCategory = async function (req, res, next) {
  let query = Category.query().orderBy("id").orderBy("name"),
    nextCursor = req.body.nextCursor;

  const trx = await Category.startTransaction();

  try {
    await Category.query(trx).insert({ name: req.body.name });
    await redis.del("categories");
    await trx.commit();
  } catch (err) {
    await trx.rollback();
    next(err);
  }

  let categories;
  if (nextCursor) {
    categories = await query.clone().cursorPage(nextCursor);
  } else {
    categories = await query.clone().cursorPage();
  }

  res.status(200).send(categories);
};

module.exports = {
  path: "/",
  method: "POST",
  middleware: [guard.check("view:admin"), validators],
  handler: addCategory,
};
