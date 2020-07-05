"use strict";
const Event = require("./models/Event");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  query("category").optional().isArray(),
  query("month").isString().toInt(10),
  query("year").isString().toInt(10),
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
];

const getAllEvents = async function (req, res, next) {
  let query = Event.query(),
    categories = req.body.categories || null,
    where = {};

  where.month = req.body.month;
  where.year = req.body.year;

  if (categories) {
    query = Array.isArray(categories)
      ? query.whereIn("category_id", categories).andWhere(where)
      : query.where({ ...where, category_id: category });
  }

  try {
    const events = await query.withGraphFetched("organizer").columns(columns);
    res.status(200).send({ events });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [guard.check("events:view"), validators],
  handler: getAllEvents,
};
