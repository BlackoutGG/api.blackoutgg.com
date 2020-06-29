"use strict";
const Event = require("./models/Event");
const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  body("name").isAlphanumeric().escape().trim(),
  body("category").isAlphanumeric().escape().trim(),
  body("month").isString().escape().trim(),
  body("start").isString().escape().trim(),
  body("end").optional().isString().escape().trim(),
  body("description").optional().isString().escape().trim(),
  body("joinable").optional().isBoolean(),
]);

const addEvent = async function (req, res, next) {
  const event = Object.assign({}, { ...req.body });
  try {
    const event = await Event.query().insert(event).returning(["id", "name"]);
    const events = await Event.query().where("month", event.month);

    return { event, events };
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "POST",
  middleware: [guard.check("events:add"), validators],
  handler: addEvent,
};
