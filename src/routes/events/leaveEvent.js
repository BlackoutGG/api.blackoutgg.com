"use strict";
const EventParticipants = require("./models/EventParticipants");
const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_EVENTS } = require("$util/policies");

const validators = validate([
  body("event_id").isNumeric().toInt(10),
  body("rvsp_enabled")
    .isBoolean()
    .custom((v) => v),
  body("joined").isBoolean(),
]);

const leaveEvent = async function (req, res, next) {
  const { joined, rvsp_enabled, ...fields } = req.body;
  const result = await EventParticipants.query()
    .where({ user_id: req.user.id, event_id: fields.event_id })
    .delete()
    .returning("*");
  res.status(200).send({ id: fields.event_id, join: false });
};

module.exports = {
  path: "/leave",
  method: "POST",
  middleware: [
    (req, res, next) => {
      console.log(req.body);
      next();
    },
    guard.check(VIEW_ALL_EVENTS),
    validators,
  ],
  handler: leaveEvent,
};
