"use strict";
const Event = require("./models/Event");
const guard = require("express-jwt-permissions")();
const columns = require("./helpers/columns.js");
const { param, query } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  param("id").isNumeric().toInt(10),
  query("id").isNumeric().toInt(10),
]);

const getEvent = async function (req, res, next) {
  try {
    const event = await Event.query()
      .joinRelated("[occurrences, category]")
      .select(columns)
      .withGraphFetched(`[organizer(defaultSelects)]`)
      .first()
      .where("events.id", req.params.id)
      .where("occurrences.id", req.query.id);

    console.log(event);

    res.status(200).send({ event });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/:id",
  method: "GET",
  middleware: [guard.check("view:events"), validators],
  handler: getEvent,
};
