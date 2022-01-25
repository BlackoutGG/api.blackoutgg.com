"use strict";
const Testimony = require("$models/Testimony");
const sanitize = require("sanitize-html");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { validate } = require("$util");
const {
  VIEW_ALL_ADMIN,
  DELETE_ALL_POSTS,
  DELETE_OWN_POSTS,
} = require("$util/policies");

const guards = guard.check([
  VIEW_ALL_ADMIN,
  [DELETE_ALL_POSTS],
  [DELETE_OWN_POSTS],
]);

const validators = validate([query("ids.*").isNumeric()]);

const middleware = [guards, validators];

const removeTestimony = async function (req, res) {
  const deleted = await Testimony()
    .whereIn(req.query.ids)
    .returning("id")
    .delete();
  res.status(200).send({ deleted });
};

module.exports = {
  path: "/testimony",
  method: "DELETE",
  middleware,
  handler: removeTestimony,
};
