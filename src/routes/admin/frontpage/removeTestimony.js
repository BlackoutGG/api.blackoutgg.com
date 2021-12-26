"use strict";
const Testimony = require("$models/Testimony");
const sanitize = require("sanitize-html");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { validate } = require("$util");

const validators = validate([query("ids.*").isNumeric()]);

const middleware = [guard.check("update:frontpage"), validators];

const removeTestimony = async function (req, res) {
  const deleted = await Testimony().whereIn(req.query.ids).delete();
  res.status(200).send({ deleted });
};

module.exports = {
  path: "/testimony",
  method: "DELETE",
  middleware,
  handler: removeTestimony,
};
