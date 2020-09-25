"use strict";
const Event = require("./models/Event");
const Range = require("pg-range").Range;
const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  // body("name").isAlphanumeric().escape().trim(),
  // body("color").optional().isString().escape().trim(),
  // body("category").optional().isNumeric(),
  body("startDate").isString().escape().trim(),
  body("endDate").optional().isString().escape().trim(),
  body("startTime").isString().escape().trim(),
  body("endTime").optional().isString().escape().trim(),
  body("description").optional().isString().escape().trim(),
  body("roles.*").optional().isNumeric(),
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

const graphFn = (userId, start, end, fields, roles) => {
  const data = {
    "#id": "event",
    duration: Range(start, end),
    start_date: start,
    end_date: end,
    user_id: userId,
    ...fields,
  };

  if (roles && roles.length) {
    Object.assign(data, {
      roles: roles.map((role) => ({
        role_id: role,
      })),
    });
  }
};

const addEvent = async function (req, res, next) {
  const { roles, startDate, endDate, ...fields } = req.body,
    userId = req.user.id;

  const insert = graphFn(userId, startDate, endDate, roles, fields);

  try {
    const event = await Event.transaction(async (trx) => {
      const query = await Event.query(trx)
        .insertGraph(insert)
        .first()
        .returning("*")
        .withGraphFetched(
          roles && roles.length
            ? `[category(defaultSelects), organizer(defaultSelects), roles]`
            : `[category(defaultSelects), organizer(defaultSelects)]`
        );

      return query;
    });

    res.status(200).send({ event });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "POST",
  middleware: [guard.check("add:events"), log],
  handler: addEvent,
};
