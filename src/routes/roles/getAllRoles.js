"use strict";
const Roles = require("./models/Roles");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { validate, buildQuery } = require("$util");

const getAllRoles = async function (req, res) {
  try {
    const roles = await buildQuery.call(
      Roles.query(),
      req.query.page,
      req.query.limit
    );
    res.status(200).send({ roles });
  } catch (err) {
    console.log(err);
    next(new Error(err));
  }
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [
    guard.check("roles:add"),
    validate([query("page").isNumeric(), query("limit").isNumeric()]),
  ],
  handler: getAllRoles,
};
