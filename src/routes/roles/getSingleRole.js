"use strict";
const Roles = require("./models/Roles");
const guard = require("express-jwt-permissions")();
const { param } = require("express-validator");
const { validate } = require("$util");

const getSingleGroup = async function (req, res) {
  try {
    const role = await Roles.query()
      .where("id", req.params.id)
      .withGraphFetched("permissions")
      .first()
      .throwIfNotFound();

    res.status(200).send({ role });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/:id",
  method: "GET",
  middleware: [guard.check("view:roles"), validate([param("id").isNumeric()])],
  handler: getSingleGroup,
};
