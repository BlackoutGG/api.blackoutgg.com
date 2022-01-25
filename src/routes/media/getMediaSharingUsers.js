"use strict";
const Media = require("$models/Media");
const Settings = require("$models/Settings");
const User = require("$models/User");
const sanitize = require("sanitize-html");
const guard = require("express-jwt-permissions")();
const { param, query } = require("express-validator");
const { VIEW_OWN_MEDIA, VIEW_ALL_MEDIA } = require("$util/policies");

const columns = ["id", "avatar", "username"];

const middleware = [
  guard.check([[VIEW_OWN_MEDIA], [VIEW_ALL_MEDIA]]),
  param("id").isUUID(),
  query("searchByUsername")
    .optional()
    .isString()
    .escape()
    .trim()
    .customSanitizer((v) => sanitize(v)),
];

const getSharingList = async function (req, res) {
  const { enable_account_media_sharing } = await Settings.query()
    .select("enable_account_media_sharing")
    .first();

  if (!enable_account_media_sharing) {
    return res.sendStatus(422);
  }

  const sharingNextCursor = req.query.sharingNextCursor,
    nextCursor = req.query.nextCursor,
    searchByUsername = req.query.searchBy;

  const queries = [];

  let sharingList = Media.query()
    .joinRelated("media_shared_users")
    .where("media.id", req.params.id)
    .select("media_shared_users.id as id")
    .orderBy("media_shared_users.username")
    .orderBy("media_shared_users.id", "asc")
    .limit(50);

  let userQuery = User.query()
    .whereNot("username", req.user.username)
    .orderBy("username")
    .orderBy("id", "asc")
    .select(columns)
    .limit(50);

  if (searchByUsername) {
    sharingList = sharingList
      .andWhere("media_shared_users.username", "like", `%${searchByUsername}%`)
      .debug();

    userQuery = userQuery
      .andWhere("username", "like", `%${searchByUsername}%`)
      .debug();
  }

  if (sharingNextCursor) {
    queries.push(sharingList.clone().cursorPage(sharingNextCursor));
  } else {
    queries.push(sharingList.clone().cursorPage());
  }

  if (nextCursor) {
    queries.push(userQuery.clone().cursorPage(nextCursor));
  } else {
    queries.push(userQuery.clone().cursorPage());
  }

  const [sharing, users] = await Promise.all(queries);

  res.status(200).send({ sharing, users });

  // const sharingList = await Media.query()
  //   .joinRelated("media_shared_users")
  //   .where("media.id", req.params.id)
  //   .select("media_shared_users.id as id")
  //   .orderBy("media_shared_users.username")
  //   .orderBy("media_shared_users.id", "asc");

  // const selected = sharingList.map(({ id }) => id);

  // console.log(sharingList);

  // const userQuery = User.query()
  //   .whereNot("username", req.user.username)
  //   .orderBy("username")
  //   .orderBy("id", "asc")
  //   .select(columns)
  //   .limit(50);

  // const users = await userQuery.clone().cursorPage();

  // res.status(200).send({ users, selected });
};

module.exports = {
  path: "/share/:id",
  method: "GET",
  middleware,
  handler: getSharingList,
};
