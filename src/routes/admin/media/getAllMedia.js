"use strict";
const Media = require("$models/Media");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { VIEW_ALL_ADMIN, VIEW_ALL_MEDIA } = require("$util/policies");

const middleware = [
  guard.check([VIEW_ALL_ADMIN, VIEW_ALL_MEDIA]),
  query("next").optional(),
];

const getAllMedia = async function (req, res, next) {
  const nextCursor = req.query.next;

  console.log(nextCursor);

  const query = Media.query().orderBy("id").limit(25);

  let media;

  if (nextCursor) media = await query.clone().cursorPage(nextCursor);
  else media = await query.clone().cursorPage();

  console.log(media);

  // const media = await buildQuery(
  //   Media.query().where("owner_id", req.user.id),
  //   req.query.start,
  //   req.query.limit
  // );
  res.status(200).send(media);
};

module.exports = {
  path: "/",
  method: "GET",
  middleware,
  handler: getAllMedia,
};
