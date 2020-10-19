"use strict";
const Events = require("./models/Event");
const guard = require("express-jwt-permissions")();
const { body, param } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  param("id").isNumeric().toInt(10),
  body("name").optional().isString().escape().trim(),
  body("category_id").optional().isNumeric(),
  body("color").optional().isString().escape().trim(),
  body("start_date").optional().isString().escape().trim(),
  body("start_time").optional().isString().escape().trim(),
  body("end_date").optional().isString().escape().trim(),
  body("end_time").optional().isString().escape().trim(),
  body("description").optional().isString().escape().trim(),
  body("rvsp").optional().isBoolean(),
]);

const log = (req, res, next) => {
  console.log(req.body);
  next();
};

const returning = [
  "id",
  "name",
  "color",
  "description",
  "start_time",
  "start_date",
  "end_time",
  "end_date",
  "category_id",
  "rvsp",
];

const middleware = [guard.check("update:events"), log, validators];

const updateEvent = async function (req, res, next) {
  const patch = req.body,
    id = parseInt(req.params.id);

  try {
    const event = await Events.query()
      .patch(patch)
      .where("id", id)
      .withGraphFetched("[category(defaultSelects), organizer(defaultSelects)]")
      .first()
      .returning(returning)
      .throwIfNotFound();

    console.log(event);

    res.status(200).send({ event });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/:id",
  method: "PUT",
  middleware,
  handler: updateEvent,
};
