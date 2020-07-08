"use strict";
const Event = require("./models/Event");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  query("category").optional().isArray(),
  query("month").isNumeric(),
  query("year").isNumeric(),
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
  "day",
  "month",
  "year",
];

const getAllEvents = async function (req, res, next) {
  let query = Event.query(),
    categories = req.query.categories || null,
    where = req.query;

  if (categories) {
    query = Array.isArray(categories)
      ? query.whereIn("category_id", categories).andWhere(where)
      : query.where({ ...where, category_id: category });
  } else {
    query = query.where(where);
  }

  try {
    const events = await query
      .withGraphFetched(
        `[organizer(defaultSelects), 
          category(defaultSelects)]`
      )
      .select(columns);

    console.log(events);
    res.status(200).send({ events });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [guard.check("events:view"), validators],
  handler: getAllEvents,
};
