"use strict";
const Event = require("./models/Event");
const guard = require("express-jwt-permissions")();
const columns = require("./helpers/columns.js");
const { param } = require("express-validator");
const { validate } = require("$util");

const validators = validate([param("id").isNumeric().toInt(10)]);

// const columns = [
//   "id",
//   "title",
//   "color",
//   "all_day",
//   "category_id",
//   "start_date",
//   "start_time",
//   "end_date",
//   "end_time",
//   "description",
//   "rvsp",
// ];

const getAllEvents = async function (req, res, next) {
  try {
    const event = await Event.query()
      .withGraphFetched(`[organizer(defaultSelects), category(defaultSelects)]`)
      .first()
      .where("id", req.params.id)
      .select(columns);

    res.status(200).send({ event });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/:id",
  method: "GET",
  middleware: [guard.check("view:events"), validators],
  handler: getAllEvents,
};
