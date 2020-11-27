"use strict";
const EventParticipants = require("./models/EventParticipants");
const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  body("event_id").isNumeric().toInt(10),
  body("rvsp_enabled")
    .isBoolean()
    .custom((v) => v),
  body("joined").isBoolean(),
]);

const joinEvent = async function (req, res, next) {
  const { joined, rvsp_enabled, ...fields } = req.body;
  try {
    const result = await EventParticipants.query()
      .insert({ user_id: req.user.id, ...fields })
      .first()
      .returning(["event_id"]);

    return res.status(200).send({ id: result.event_id, join: true });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/join",
  method: "POST",
  middleware: [
    (req, res, next) => {
      console.log(req.body);
      next();
    },
    guard.check("view:events"),
    validators,
  ],
  handler: joinEvent,
};
