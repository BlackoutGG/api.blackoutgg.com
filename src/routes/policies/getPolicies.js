"use strict";
const Policies = require("./models/Policies.js");
const guard = require("express-jwt-permissions")();

const getPolicies = async function (req, res, next) {
  const _policies = await Policies.query().where("level", ">=", req.user.level);
  res.status(200).send(_policies);
};

module.exports = {
  path: "/",
  method: "GET",
  // middleware: [guard.check(["view:roles", "update:roles"])],
  handler: getPolicies,
};
