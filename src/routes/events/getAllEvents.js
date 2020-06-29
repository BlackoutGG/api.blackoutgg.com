"use strict";
const Event = require("./models/Event");
const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  body("category").isAlphanumeric().escape().trim(),
  body("month").isString().escape().trim(),
]);

const getAllEvents = async function (req, res, next) {
  const where = Object.assign({}, { ...req.body });
  try {
    const events = await Event.query().where(where);

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
