"use strict";
const Media = require("./models/Media");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { buildQuery } = require("$util");

const middleware = [
  guard.check("media:view"),
  query("page").optional().isNumeric(),
  query("limit").optional().isNumeric(),
];

const getAllMedia = async function (req, res, next) {
  try {
    const media = await buildQuery.call(
      Media.query(),
      req.query.page,
      req.query.limit
    );
    res.status(200).send({ media });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "GET",
  middleware,
  handler: getAllMedia,
};
