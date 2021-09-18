"use strict";
const Base = require("$base");
const knex = Base.knex();
const sanitize = require("sanitize-html");
const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  body("info.*")
    .notEmpty()
    .isString()
    .trim()
    .escape()
    .customSanitizer((v) => sanitize(v)),
]);

const middleware = [guard.check("update:frontpage"), validators];

const updateInfoblock = async function (req, res) {
  const info = await knex.into("front_page_info").insert(req.body.info);
  res.status(200).send({ info });
};

module.exports = {
  path: "/info",
  method: "POST",
  middleware,
  handler: updateInfoblock,
};
