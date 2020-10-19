"use strict";
const Event = require("./models/Event");
const Range = require("pg-range").Range;
const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate } = require("$util");
const pick = require("lodash/pick");

const validators = validate([
  body("name").isString().escape().trim(),
  body("color").optional().isString().escape().trim(),
  body("category").optional().isNumeric(),
  body("start_date").isString().escape().trim(),
  body("end_date").optional().isString().escape().trim(),
  body("start_time").isString().escape().trim(),
  body("end_time").optional().isString().escape().trim(),
  body("description").optional().isString().escape().trim(),
  // body("roles.*").optional().isNumeric(),
  body("rvsp").optional().isBoolean(),
]);

const values = [
  "id",
  "name",
  "color",
  "category_id",
  "category",
  "organizer",
  "start_time",
  "start_date",
  "end_time",
  "end_date",
  "description",
  "rvsp",
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

  return data;
};

const addEvent = async function (req, res, next) {
  const { roles, start_date, end_date, filters, ...fields } = req.body;

  const insert = graphFn(req.user.id, start_date, end_date, fields);

  try {
    const event = await Event.transaction(async (trx) => {
      const result = await Event.query(trx)
        .insertGraph(insert)
        .columns(values)
        .withGraphFetched(
          "[category(defaultSelects), organizer(defaultSelects)]"
        );

      if (filters && Object.keys(filters).length) {
        if (filters.category_id.includes(result.category_id)) {
          return pick(result, values);
        }
      }

      return pick(result, values);
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
