"use strict";
const Event = require("./models/Event");
const EventRoles = require("./models/EventRoles");
const Range = require("pg-range").Range;
const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate } = require("$util");

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
  const { roles, startDate, endDate, ...fields } = req.body,
    userId = req.user.id;

  console.log("adding event....");

  const data = {
    "#id": "event",
    duration: Range(startDate, endDate),
    startDate,
    endDate,
    user_id: userId,
    ...fields,
  };

  if (roles && roles.length) {
    Object.assign(data, {
      roles: roles.map((role) => ({
        event_id: "#ref(event.id)",
        role_id: role,
      })),
    });
  }

  let query = Event.query()
    .insertGraph(data)
    .first()
    .returning("*")
    .withGraphFetched(
      roles && roles.length
        ? `[category(defaultSelects), organizer(defaultSelects), roles]`
        : `[category(defaultSelects), organizer(defaultSelects)]`
    );

  try {
    const event = await query;
    // const results = await Event.transaction(async (trx) => {
    //   const result = await Event.query(trx)
    //     .insert({
    //       duration: Range(startDate, endDate),
    //       startDate,
    //       endDate,
    //       ...fields,
    //       user_id: userId,
    //     })
    //     .first()
    //     .returning("id");

    //   if (roles && roles.length) {
    //     await EventRoles.query(trx).insert(
    //       roles.map((role) => ({ event_id: result.id, role_id: role }))
    //     );
    //   }

    // const event = await Event.query(trx)
    //   .where("id", result.id)
    //   .withGraphFetched(
    //     roles && roles.length
    //       ? `[category(defaultSelects), organizer(defaultSelects), roles]`
    //       : `[category(defaultSelects), organizer(defaultSelects)]`
    //   )
    //   .select(columns)
    //   .first();

    //   return event;
    // });

    res.status(200).send({ event });
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
