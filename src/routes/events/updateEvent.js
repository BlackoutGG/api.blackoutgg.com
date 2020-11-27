"use strict";
const Events = require("./models/Event");
const EventParticipants = require("./models/EventParticipants");

const guard = require("express-jwt-permissions")();
// const returning = require("./helpers/columns");

const { body, param } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  param("id").isNumeric().toInt(10),
  body("title").optional().isString().escape().trim(),
  body("category_id").optional().isNumeric(),
  body("color").optional().isString().escape().trim(),
  body("start_date").optional().isString().escape().trim(),
  body("start_time").optional().isString().escape().trim(),
  body("end_date").optional().isString().escape().trim(),
  body("end_time").optional().isString().escape().trim(),
  body("description").optional().isString().escape().trim(),
  body("rvsp").optional().isBoolean(),
]);

const log = (req, res, next) => {
  console.log(req.body);
  next();
};

const middleware = [guard.check("update:events"), log, validators];

const updateEvent = async function (req, res, next) {
  const { id, start_date, end_date, ...patch } = req.body,
    event_id = req.params.id;

  try {
    const event = await Events.transaction(async (trx) => {
      let results = [];

      if (patch.details && Object.keys(patch.details).length) {
        results = results.concat(
          await Events.query(trx)
            .patch(patch)
            .where({ event_id })
            .returning(["id", ...Object.keys(patch)])
        );
      }

      if (start_date || end_date) {
        let dates = {};
        let returning = [];

        if (start_date) {
          Object.assign(dates, { start_date });
          returning.push("start_date");
        }

        if (end_date) {
          Object.assign(dates, { end_date });
          returning.push("end_date");
        }

        const relation = await Event.relatedQuery("occurrences", trx)
          .patch(dates)
          .where("id", id)
          .returning(returning);

        results = results.concat(relation);
      }

      // const result = await Event.query(trx)
      //   .joinRelated("[category, occurrences]")
      //   .where("events.id", event_id)
      //   .where("occurrences.id", id)
      //   .withGraphFetched("organizer(defaultSelects)")
      //   .select([
      //     ...columns,
      //     EventParticipants.query()
      //       .count("*")
      //       .as("participants")
      //       .whereColumn("event_id", "occurrences.id"),
      //     EventParticipants.query()
      //       .select("user_id")
      //       .as("joined")
      //       .whereColumn("event_id", "occurrences.id")
      //       .where("user_id", req.user.id),
      //   ]);

      return results.reduce((output, item) => {
        Object.assign(output, item);
        return output;
      }, {});
    });

    res.status(200).send({ event });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/:id",
  method: "PUT",
  middleware,
  handler: updateEvent,
};
