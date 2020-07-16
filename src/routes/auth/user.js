"use strict";

const userDetails = function (req, res) {
  if (!req.user) res.status(403).send("Forbidden");
  const { id, username, avatar, roles, permissions } = req.user;
  const user = {
    id,
    username,
    avatar,
    roles: roles.map(({ name }) => name),
    scope: permissions,
  };
  res.status(200).send({ user });
};

module.exports = {
  path: "/user",
  method: "GET",
  handler: userDetails,
};
