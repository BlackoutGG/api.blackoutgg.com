"use strict";
const Tag = require("$models/Tag");
const guard = require("express-jwt-permissions")();
const sanitize = require("sanitize-html");
const { query } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN } = require("$util/policies");

const validateTagName = async function (req, res, next) {
  const tag = await Tag.query().where("name", req.query.value).first();
  if (tag) return res.status(422).send("name already exists.");
  res.status(200).send();
};

module.exports = {
  path: "/tags",
  method: "GET",
  middleware: [
    guard.check([VIEW_ALL_ADMIN]),
    validate([
      query("value")
        .notEmpty()
        .isAlphanumeric()
        .withMessage("Tag name must be alphanumeric.")
        .isLength({ min: 3, max: 30 })
        .withMessage("Tag name must be 3 to 30 in length.")
        .escape()
        .trim()
        .customSanitizer((v) => sanitize(v)),
    ]),
  ],
  handler: validateTagName,
};
