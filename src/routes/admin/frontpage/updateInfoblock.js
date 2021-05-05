"use strict";
const Base = require("$base");
const knex = Base.knex();
const sanitize = require("sanitize-html");
const guard = require("express-jwt-permissions")();
const { body, param } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  body("info.*")
    .notEmpty()
    .isString()
    .trim()
    .escape()
    .customSanitizer((v) => sanitize(v)),
  param("id").isNumeric().toInt(10),
]);

const middleware = [guard.check("update:frontpage"), validators];

const addInfoblock = async function (req, res) {
  const info = await knex
    .into("front_page_info")
    .patch(req.body.info)
    .where("id", req.params.id);
  res.status(200).send({ info });
};

module.exports = {
  path: "/info/:id",
  method: "PATCH",
  middleware,
  handler: addInfoblock,
};
