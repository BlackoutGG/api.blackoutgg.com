"use strict";
const Event = require("./models/Event");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  query("category").optional().isArray(),
  query("month").isNumeric(),
  query("year").isNumeric(),
  query("start").isString(),
  query("end").isString(),
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

const getAllEvents = async function (req, res, next) {
  let query = Event.query(),
    categories = req.query.categories || null,
    { month, year, start, end, ...where } = req.query;

  if (categories) {
    query = Array.isArray(categories)
      ? query.whereIn("category_id", categories).andWhere(where)
      : query.where({ ...where, category_id: category });
  } else {
    // query = query.where(where);
    // query = query.where("endDate", ">=", start).andWhere("endDate", "<=", end);
    query = query
      .whereBetween("end", [start, end])
      .whereBetween("start", [start, end]);
    // query = query.where({ year, month }).orWhere("endDate", ">=", start);
  }

  try {
    const events = await query
      .withGraphFetched(
        `[organizer(defaultSelects), 
          category(defaultSelects)]`
      )
      .select(columns);

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
