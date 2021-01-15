"use strict";
const Event = require("./models/Event");
const EventParticipants = require("./models/EventParticipants");
const guard = require("express-jwt-permissions")();
const generateGraph = require("./helpers/generate-insert-graph");
const columns = require("./helpers/columns");
const { body } = require("express-validator");
const { validate } = require("$util");
const { raw } = require("objection");

const validators = validate([
  body("id").optional().isNumeric().toInt(10),
  body("title").isString().escape().trim(),
  body("color").optional().isString().escape().trim(),
  body("category").optional().isNumeric(),
  body("start_date").isString().escape().trim(),
  body("end_date").optional().isString().escape().trim(),
  body("start_time").isString().escape().trim(),
  body("end_time").optional().isString().escape().trim(),
  body("description").optional().isString().escape().trim(),
  body("start").isString().escape().trim(),
  body("end").isString().escape().trim(),
  body("isRecurring").isBoolean(),
  // body("roles.*").optional().isNumeric(),
  body("rvsp").optional().isBoolean(),
]);

const log = (req, res, next) => {
  console.log(req.body);
  next();
};

// const select = [
//   "events.id as event_id",
//   "occurrences.group_id as group_id",
//   "occurrences.id as id",
//   "all_day",
//   "title",
//   "color",
//   "events.category_id",
//   "description",
//   "occurrences.start_date as start_date",
//   "occurrences.end_date as end_date",
//   "rvsp",
//   "category.name as category",
// ];

const addEvent = async function (req, res, next) {
  const { start, end, wasRecurring, isRecurring, ...fields } = req.body;
  const insert = generateGraph(req.user.id, fields);
  console.log(insert);

  const data = await Event.transaction(async (trx) => {
    if (wasRecurring) {
      await Event.relatedQuery("occurrences", trx)
        .delete()
        .where("id", req.body.id);
    }

    const entry = await Event.query(trx)
      .insertGraph(insert)
      .returning("id")
      .first();

    let query = Event.query(trx)
      .joinRelated("[category, occurrences]")
      .where("event_id", entry.id)
      .where(
        raw("daterange(start_date, end_date, '[]') && '[??,??)'", start, end)
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
          .where("user_id", req.user.id),
      ]);

    if (!fields.interval !== "once") query = query.first();

    const results = await query;

    return results;
  });

  console.log(data);

  res.status(200).send(data);
};

module.exports = {
  path: "/",
  method: "POST",
  middleware: [guard.check("add:events"), log],
  handler: addEvent,
};
