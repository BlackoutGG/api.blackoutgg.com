"use strict";
const Category = require("./models/Category");
const guard = require("express-jwt-permissions")();
const { validate, buildQuery } = require("$util");

const getAllCategories = async function (req, res, next) {
  const recruitment = req.query.recruitment || null;

  let query = Category.query();

  if (recruitment) {
    query = query.where({ recruitment });
  }

  const categories = await buildQuery(query, req.query.page, req.query.limit);
  res.status(200).send({ categories });
};

module.exports = {
  path: "/",
  method: "GET",
  handler: getAllCategories,
};
