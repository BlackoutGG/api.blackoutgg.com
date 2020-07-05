"use strict";
const Event = require("./models/Event");
const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  body("name").isAlphanumeric().escape().trim(),
  // body("color").optional().isString().escape().trim(),
  // body("category").optional().isNumeric(),
  // body("month").isNumeric(),
  // body("year").isNumeric(),
  // body("startDate").isString().escape().trim(),
  // body("endDate").optional().isString().escape().trim(),
  // body("startTime").isString().escape().trim(),
  // body("endTime").optional().isString().escape().trim(),
  // body("description").optional().isString().escape().trim(),
  // body("rvsp").optional().isBoolean(),
]);

const log = (req, res, next) => {
  console.log(req.body);
  next();
};

const addEvent = async function (req, res, next) {
  try {
    const event = await Event.query()
      .insert({ ...req.body, user_id: req.user.id })
      .returning("*");
    res.status(200).send({ event });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "POST",
  middleware: [guard.check("events:add"), log],
  handler: addEvent,
};
