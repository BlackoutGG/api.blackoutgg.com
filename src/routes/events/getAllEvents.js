"use strict";
const Event = require("./models/Event");
const EventParticipants = require("./models/EventParticipants");
const guard = require("express-jwt-permissions")();
const columns = require("./helpers/columns");
const { query } = require("express-validator");
const { validate } = require("$util");
const { raw } = require("objection");
const { VIEW_ALL_EVENTS } = require("$util/policies");

const validators = validate([
  // query("category_id").optional().isArray(),
  query("start").isString(),
  query("end").isString(),
]);

// const columns = [
//   "events.id as event_id",
//   "occurrences.group_id as group_id",
//   "occurrences.id as id",
//   "all_day",
//   "title",
//   "color",
//   "events.category_id",
//   "description",
//   "interval",
//   "occurrences.start_date as start_date",
//   "occurrences.end_date as end_date",
//   "rvsp",
//   "category.name as category",
// ];

const getAllEvents = async function (req, res, next) {
  console.log(req.query);

  const events = await Event.query()
    .joinRelated("[category, occurrences]")
    .where(
      raw(
        "daterange(start_date, end_date, '[]') && '[??,??)'",
        req.query.start,
        req.query.end
      )
    )
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
    ]);

  console.log(events);

  res.status(200).send({ events });
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [guard.check(VIEW_ALL_EVENTS), validators],
  handler: getAllEvents,
};
