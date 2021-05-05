"use strict";
const Media = require("./models/Media");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { buildQuery } = require("$util");
const { VIEW_OWN_MEDIA } = require("$util/permissions");

const middleware = [
  guard.check(VIEW_OWN_MEDIA),
  query("start").optional().isNumeric(),
  query("limit").optional().isNumeric(),
];

const getOwnMedia = async function (req, res, next) {
  const media = await buildQuery(
    Media.query().where("owner_id", req.user.id),
    req.query.start,
    req.query.limit
  );
  res.status(200).send({ media: media.results });
};

module.exports = {
  path: "/own",
  method: "GET",
  middleware,
  handler: getOwnMedia,
};
