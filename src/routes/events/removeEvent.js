"use strict";
const Event = require("./models/Event");
const guard = require("express-jwt-permissions")();
const { param } = require("express-validator");
const { validate } = require("$util");

const validators = validate([param("eventId").toInt(10).isNumeric()]);

const removeEvent = async function (req, res, next) {
  try {
    const event = Event.query()
      .where("id", req.params.id)
      .delete()
      .returning("id");
    res.status(200).send({ event });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/:id",
  method: "DELETE",
  middleware: [guard.check("delete:events"), validators],
  handler: removeEvent,
};
