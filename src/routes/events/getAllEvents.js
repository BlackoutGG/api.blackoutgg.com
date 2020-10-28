"use strict";
const Event = require("./models/Event");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { validate } = require("$util");
const { raw } = require("objection");

const validators = validate([
  // query("category_id").optional().isArray(),
  query("start").isString(),
  query("end").isString(),
]);

const columns = [
  "events.id",
  "title",
  "category_id",
  "color",
  "start_date",
  "start_time",
  "interval",
  "end_date",
  "end_time",
  "description",
  "rvsp",
  "category.name as category",
];

const getAllEvents = async function (req, res, next) {
  console.log(req.query);

  const filters = req.query.filters || null,
    { start, end, ...where } = req.query;

  let query = Event.query();

  if (filters && Object.keys(filters).length) {
    query = query.whereIn("category_id", filters.category_id);
  }

  query = query.where(raw("duration && '[??, ??)'", start, end));

  // query = query.where(
  //   raw(
  //     "daterange('startDate'::date, 'endDate'::date, '[]') && '[??,??)'",
  //     start,
  //     end
  //   )
  // );

  try {
    const events = await query
      .joinRelated("category")
      .withGraphFetched("organizer(defaultSelects)")
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
  middleware: [guard.check("view:events"), validators],
  handler: getAllEvents,
};
