"use strict";
const EventParticipants = require("./models/EventParticipants");
const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_EVENTS } = require("$util/permissions");

const validators = validate([
  body("event_id").isNumeric().toInt(10),
  body("rvsp_enabled")
    .isBoolean()
    .custom((v) => v),
  body("joined").isBoolean(),
]);

const joinEvent = async function (req, res, next) {
  const { joined, rvsp_enabled, ...fields } = req.body;
  const result = await EventParticipants.query()
    .insert({ user_id: req.user.id, ...fields })
    .first()
    .returning(["event_id"]);

  return res.status(200).send({ id: result.event_id, join: true });
};

module.exports = {
  path: "/join",
  method: "POST",
  middleware: [
    (req, res, next) => {
      console.log(req.body);
      next();
    },
    guard.check(VIEW_ALL_EVENTS),
    validators,
  ],
  handler: joinEvent,
};
