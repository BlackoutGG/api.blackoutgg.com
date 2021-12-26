"use strict";
const Media = require("$models/Media");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { VIEW_OWN_MEDIA } = require("$util/policies");

const middleware = [guard.check(VIEW_OWN_MEDIA), query("next").optional()];

const getOwnMedia = async function (req, res, next) {
  const nextCursor = req.query.next;

  const query = Media.query()
    .where("owner_id", req.user.id)
    .orderBy("id")
    .orderBy("owner_id")
    .limit(25);

  let media;

  if (nextCursor) media = await query.clone().cursorPage(nextCursor);
  else media = await query.clone().cursorPage();

  // const media = await buildQuery(
  //   Media.query().where("owner_id", req.user.id),
  //   req.query.start,
  //   req.query.limit
  // );

  console.log(media);

  res.status(200).send(media);
};

module.exports = {
  path: "/",
  method: "GET",
  middleware,
  handler: getOwnMedia,
};
