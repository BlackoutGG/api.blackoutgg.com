"use strict";
const Roles = require("./models/Roles");
const guard = require("express-jwt-permissions")();
const createError = require("http-errors");
const { param } = require("express-validator");
const { validate } = require("$util");

const getSingleGroup = async function (req, res) {
  try {
    const group = await Roles.query()
      .where("id", req.params.id)
      .first()
      .throwIfNotFound();

    res.status(200).send({ group });
  } catch (err) {
    // if (err.name && err.name === "NotFoundError") {
    //   return next(createError(404, "Role doesn't exist."));
    // }
    next(new Error(err));
  }
};

module.exports = {
  path: "/:id",
  method: "GET",
  middleware: [guard.check("roles:view"), validate([param("id").isNumeric()])],
  handler: getSingleGroup,
};
