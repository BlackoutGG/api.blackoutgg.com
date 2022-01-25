"use strict";
const Tag = require("$models/Tag");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const filterQuery = require("$util/filterQuery");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, VIEW_ALL_CATEGORIES } = require("$util/policies");

const getAllCategories = async function (req, res, next) {
  const nextCursor = req.query.nextCursor;

  let query = filterQuery(
    Tag.query().orderBy("id").orderBy("created_at"),
    req.query.filters
  );

  let tags;

  if (nextCursor) {
    tags = await query.clone().cursorPage(nextCursor);
  } else {
    tags = await query.clone().cursorPage();
  }

  res.status(200).send(tags);
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [
    guard.check([VIEW_ALL_ADMIN, VIEW_ALL_CATEGORIES]),
    validate([query("nextCursor").optional().isString().trim().escape()]),
  ],
  handler: getAllCategories,
};
