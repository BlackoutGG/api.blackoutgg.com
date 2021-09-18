"use strict";
const User = require("./models/User");

const { header } = require("express-validator");

const columns = [
  "avatar",
  "username",
  "first_name",
  "last_name",
  "gender",
  "description",
  "email",
  "location",
  "birthday",
  "discord_id",
  "local",
];

const getOwnUserDetails = async function (req, res, next) {
  if (!req.user) {
    return res.status(403).send("Forbidden");
  }

  let user = await User.query()
    .select(columns)
    .where("id", req.user.id)
    .first();

  res.status(200).send(user);
};

module.exports = {
  path: "/me",
  method: "GET",
  middleware: [header("Authorization").notEmpty()],
  handler: getOwnUserDetails,
};
