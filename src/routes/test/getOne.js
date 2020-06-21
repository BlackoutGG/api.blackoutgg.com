"use strict";
const User = require("$models/User");

const getOne = async function (req, res, next) {
  try {
    let users = await User.query()
      .where("id", 1)
      .withGraphFetched("roles")
      .first()
      .throwIfNotFound();

    users = {
      id: users.id,
      username: users.username,
      role: users.getRoles(),
      permissions: users.getScope(),
    };

    res.status(200).send({ users });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "GET",
  handler: getOne,
};
