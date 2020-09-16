"use strict";
const Event = require("./models/Event");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { validate } = require("$util");
const { raw } = require("objection");

const validators = validate([
  query("category").optional().isArray(),
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
];

const getAllEvents = async function (req, res, next) {
  let query = Event.query(),
    categories = req.query.categories || null,
    { start, end, ...where } = req.query;

  if (categories) {
    query = Array.isArray(categories)
      ? query.whereIn("category_id", categories)
      : query.where({ category_id: category });
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
  middleware: [guard.check("view:events"), validators],
  handler: getAllEvents,
};
