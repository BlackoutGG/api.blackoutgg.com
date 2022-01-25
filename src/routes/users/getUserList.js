"use strict";
const User = require("$models/User");
const filterQuery = require("$util/filterQuery");
const { query } = require("express-validator");
const { validate } = require("$util");

const columns = ["id", "avatar", "username"];

const getSideMenuUserList = async function (req, res) {
  const filters = req.query.filters || null,
    nextCursor = req.query.nextCursor;

  console.log(req.user);

  const userQuery = filterQuery(
    User.query()
      .orderBy("username")
      .orderBy("id", "asc")
      .select(columns)
      .limit(50),
    filters
  );

  let query;

  if (nextCursor) {
    query = await userQuery.clone().cursorPage(nextCursor);
  } else {
    query = await userQuery.clone().cursorPage();
  }

  console.log(query);

  res.status(200).send({ users: query });
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [
    validate([query("nextCursor").optional().isString().escape().trim()]),
  ],
  handler: getSideMenuUserList,
};
