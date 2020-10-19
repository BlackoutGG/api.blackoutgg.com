"use strict";
const Media = require("./models/Media");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { buildQuery } = require("$util");

const middleware = [
  guard.check("view:media"),
  query("start").optional().isNumeric(),
  query("limit").optional().isNumeric(),
];

const getAllMedia = async function (req, res, next) {
  try {
    const media = await buildQuery(
      Media.query(),
      req.query.start,
      req.query.limit
    );
    res.status(200).send({ media: media.results });
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
