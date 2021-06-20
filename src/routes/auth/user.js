"use strict";
const User = require("$models/User");

const userDetails = async function (req, res, next) {
  if (!req.user) res.status(403).send("Forbidden");
  const { id, roles, level, permissions } = req.user;

  const results = await User.query()
    .select("username", "avatar")
    .where("id", req.user.id)
    .first();

  const user = {
    id,
    username: results.username,
    avatar: results.avatar,
    roles,
    level,
    scope: permissions,
  };
  res.status(200).send({ user });
};

module.exports = {
  path: "/user",
  method: "GET",
  handler: userDetails,
};
