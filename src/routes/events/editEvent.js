"use strict";
const CalendarEvent = require("./models/Event");
const guard = require("express-jwt-permissions")();
const { body, param } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  param("id").isNumeric(),
  body("name").optional().isAlphanumeric().escape().trim(),
  body("category_id").optional().isNumeric(),
  body("color").optional().isString().escape().trim(),
  body("month").optional().isNumeric(),
  body("year").optional().isNumeric(),
  body("startDate").optional().isString().escape().trim(),
  body("startTime").optional().isString().escape().trim(),
  body("endDate").optional().isString().escape().trim(),
  body("endTime").optional().isString().escape().trim(),
  body("description").optional().isString().escape().trim(),
  body("rvsp").optional().isBoolean(),
]);

const log = (req, res, next) => {
  console.log(req.body);
  next();
};

const middleware = [guard.check("events:edit"), log, validators];

const editEvent = async function (req, res, next) {
  const patch = req.body,
    id = parseInt(req.params.id),
    returning = Object.keys(patch);

  let query = CalendarEvent.query()
    .patch(patch)
    .where("id", id)
    .first()
    .returning(["id", ...returning])
    .throwIfNotFound();

  if (patch.category_id) {
    query = query.withGraphFetched(`[category(defaultSelects)]`);
  }

  try {
    const { category_id, ...event } = await query;
    res.status(200).send({ event });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/:id",
  method: "PUT",
  middleware,
  handler: editEvent,
};
