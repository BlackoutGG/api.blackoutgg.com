"use strict";
const Event = require("./models/Event");
const EventRoles = require("./models/EventRoles");
const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate } = require("$util");
const uuid = require("uuidv4");

const validators = validate([
  // body("name").isAlphanumeric().escape().trim(),
  // body("color").optional().isString().escape().trim(),
  // body("category").optional().isNumeric(),
  body("month").isNumeric(),
  body("year").isNumeric(),
  body("startDate").isString().escape().trim(),
  body("endDate").optional().isString().escape().trim(),
  body("startTime").isString().escape().trim(),
  body("endTime").optional().isString().escape().trim(),
  body("description").optional().isString().escape().trim(),
  body("roles").isArray(),
  // body("rvsp").optional().isBoolean(),
]);

const columns = [
  "id",
  "name",
  "color",
  "startTime",
  "startDate",
  "start",
  "end",
  "endTime",
  "endDate",
  "description",
  "rvsp",
  "month",
  "year",
];

const log = (req, res, next) => {
  console.log(req.body);
  next();
};

const addEvent = async function (req, res, next) {
  const { roles, startDate, startTime, endDate, endTime, ...fields } = req.body,
    userId = req.user.id;

  const start = startDate + " " + startTime;
  const end = endDate + " " + endTime;

  try {
    const results = await Event.transaction(async (trx) => {
      const result = await Event.query(trx)
        .insert({
          startDate,
          startTime,
          endDate,
          endTime,
          start,
          end,
          ...fields,
          user_id: userId,
        })
        .first()
        .returning("id");

      if (roles && roles.length) {
        await EventRoles.query(trx).insert(
          roles.map((role) => ({ event_id: result.id, role_id: role }))
        );
      }

      const event = await Event.query(trx)
        .where("id", result.id)
        .withGraphFetched(
          roles && roles.length
            ? `[category(defaultSelects), organizer(defaultSelects), roles]`
            : `[category(defaultSelects), organizer(defaultSelects)]`
        )
        .select(columns)
        .first();

      return event;
    });

    res.status(200).send({ event: results });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "POST",
  middleware: [guard.check("events:add"), log],
  handler: addEvent,
};
