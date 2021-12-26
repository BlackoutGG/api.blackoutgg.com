"use strict";
const Category = require("$models/Category");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const filterQuery = require("$util/filterQuery");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, VIEW_ALL_CATEGORIES } = require("$util/policies");

const getAllCategories = async function (req, res, next) {
  // const recruitment = req.query.recruitment || null;
  const nextCursor = req.query.nextCursor;

  let query = filterQuery(
    Category.query().orderBy("id").orderBy("created_at"),
    req.query.filters
  );

  let categories;

  if (nextCursor) {
    categories = await query.clone().cursorPage(nextCursor);
  } else {
    categories = await query.clone().cursorPage();
  }

  // if (recruitment) {
  //   query = query.where({ recruitment });
  // }

  // const categories = await buildQuery(query, req.query.page, req.query.limit);
  res.status(200).send(categories);
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
