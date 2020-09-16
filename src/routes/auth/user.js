"use strict";

const userDetails = function (req, res) {
  if (!req.user) res.status(403).send("Forbidden");
  const { id, username, avatar, roles, level, permissions } = req.user;
  const user = {
    id,
    username,
    avatar,
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
