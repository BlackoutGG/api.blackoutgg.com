"use strict";
const Form = require("./models/Form");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  query("id").isNumeric(),
  query("key").optional().isString().isIn(["category_id", "id"]),
  query("status").optional().isBoolean(),
]);

const getAllForms = async function (req, res, next) {
  console.log(req.query);

  const { key, id } = req.query;

  const params = {
    [key]: id,
  };

  if (req.query.status) {
    Object.assign(params, { status: req.query.status });
  }

  try {
    const form = await Form.query()
      .withGraphFetched("[category(selectBanner), fields]")
      .select("id", "name", "description", "category_id")
      .where(params)
      .first()
      .throwIfNotFound();

    console.log(form);

    res.status(200).send({ form });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/single",
  method: "GET",
  middleware: [guard.check("users:view"), validators],
  handler: getAllForms,
};
