"use strict";
const Media = require("$models/Media");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { buildQuery } = require("$util");
const { VIEW_ALL_ADMIN, VIEW_ALL_MEDIA } = require("$util/policies");

const middleware = [
  guard.check([VIEW_ALL_ADMIN, VIEW_ALL_MEDIA]),
  query("start").optional().isNumeric(),
  query("limit").optional().isNumeric(),
];

const getAllMedia = async function (req, res, next) {
  const media = await buildQuery(
    Media.query(),
    req.query.start,
    req.query.limit
  );
  res.status(200).send({ media: media.results });
};

module.exports = {
  path: "/",
  method: "GET",
  middleware,
  handler: getAllMedia,
};
