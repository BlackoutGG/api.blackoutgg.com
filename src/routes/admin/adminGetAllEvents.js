"use strict";
const Event = require("$models/Event");
const EventCat = require("$models/EventCategory");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  query("category").optional().isAlphanumeric().escape().trim(),
  query("month").isString().toInt(),
  query("year").isString().toInt(),
]);

const adminGetAllEvents = async function (req, res, next) {
  const where = req.body;
  const e = Event.query().where(where);
  const c = EventCat.query();
  try {
    const [events, categories] = await Promise.all([e, c]);
    res.status(200).send({ events, categories });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/events",
  method: "GET",
  middleware: [guard.check("events:view"), validators],
  handler: adminGetAllEvents,
};
