"use strict";
const Event = require("./models/Event");
const guard = require("express-jwt-permissions")();
const columns = require("./helpers/columns.js");
const { param, query } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_EVENTS } = require("$util/permissions");

const validators = validate([
  param("id").isNumeric().toInt(10),
  query("id").isNumeric().toInt(10),
]);

const getEvent = async function (req, res, next) {
  // const event = await Event.query()
  //   .joinRelated("[occurrences, category]")
  //   .select(columns)
  //   .withGraphFetched(`[organizer(defaultSelects)]`)
  //   .first()
  //   .where("events.id", req.params.id)
  //   .where("occurrences.id", req.query.id);

  const event = await Event.query()
    .joinRelated("[category, occurrences]")
    .where("events.id", req.params.id)
    .where("occurrences.id", req.query.id)
    .withGraphFetched("organizer(defaultSelects)")
    .select([
      ...columns,
      EventParticipants.query()
        .count("*")
        .as("participants")
        .whereColumn("event_id", "occurrences.id"),
      EventParticipants.query()
        .count()
        .as("joined")
        .whereColumn("event_id", "occurrences.id")
        .where({ user_id: req.user.id }),
    ])
    .first();

  res.status(200).send({ event });
};

module.exports = {
  path: "/:id",
  method: "GET",
  middleware: [guard.check(VIEW_ALL_EVENTS), validators],
  handler: getEvent,
};
