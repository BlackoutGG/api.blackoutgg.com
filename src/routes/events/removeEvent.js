"use strict";
const Event = require("./models/Event");
const guard = require("express-jwt-permissions")();
const { param } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, REMOVE_ALL_EVENTS } = require("$util/permissions");

const validators = validate([param("eventId").toInt(10).isNumeric()]);

const removeEvent = async function (req, res, next) {
  const event = Event.query()
    .where("id", req.params.id)
    .delete()
    .returning("id");
  res.status(200).send({ event });
};

module.exports = {
  path: "/:id",
  method: "DELETE",
  middleware: [guard.check([VIEW_ALL_ADMIN, REMOVE_ALL_EVENTS]), validators],
  handler: removeEvent,
};
