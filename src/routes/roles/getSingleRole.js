"use strict";
const Roles = require("./models/Roles");
const guard = require("express-jwt-permissions")();
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
    next(err);
  }
};

module.exports = {
  path: "/:id",
  method: "GET",
  middleware: [guard.check("roles:view"), validate([param("id").isNumeric()])],
  handler: getSingleGroup,
};
