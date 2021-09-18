"use strict";
const Testimony = require("$models/Testimony");
const sanitize = require("sanitize-html");
const guard = require("express-jwt-permissions")();
const { body, param } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  body("testimony.*")
    .notEmpty()
    .isString()
    .trim()
    .escape()
    .customSanitizer((v) => sanitize(v)),
  param("id").isNumeric().toInt(10),
]);

const middleware = [guard.check("update:frontpage"), validators];

const patchTestimony = async function (req, res) {
  const testimony = await Testimony.query()
    .patch(req.body.testimony)
    .where("id", req.params.id);

  res.status(200).send({ testimony });
};

module.exports = {
  path: "/testimony/:id",
  method: "PATCH",
  middleware,
  handler: patchTestimony,
};
