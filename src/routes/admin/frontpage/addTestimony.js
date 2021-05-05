"use strict";
const Testimony = require("$models/Testimony");
const sanitize = require("sanitize-html");
const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  body("testimony.*")
    .notEmpty()
    .isString()
    .trim()
    .escape()
    .customSanitizer((v) => sanitize(v)),
]);

const middleware = [guard.check("update:frontpage"), validators];

const addTestimony = async function (req, res) {
  const testimony = await Testimony.transaction(async (trx) => {
    const test = await Testimony.query(trx)
      .insert(req.body.testimony)
      .returning("id");
    const result = await Testimony.query(trx)
      .patch({ order: test.id })
      .where("id", test.id);

    return result;
  });

  res.status(200).send({ testimony });
};

module.exports = {
  path: "/testimony",
  method: "POST",
  middleware,
  handler: addTestimony,
};
