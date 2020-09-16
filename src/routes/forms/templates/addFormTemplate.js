"use strict";
const Form = require("../models/Form");

const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { buildQuery, validate } = require("$util");

const validators = validate([
  body("form.category_id").isNumeric(),
  body("form.*").isString().trim().escape(),
  body("fields.*.order").isNumeric(),
  body("fields.*.optional").isBoolean(),
  body("fields.*").isString().trim().escape(),
]);

const insertFn = (form, fields) => {
  const result = {};

  if (form && Object.keys(form).length) {
    Object.assign(result, { "#id": "form" }, form);
  }

  if (fields && fields.length) {
    Object.assign(result, {
      fields: fields.map((field) => {
        field.options =
          field.options && field.options.length
            ? JSON.stringify(field.options)
            : null;
        return field;
      }),
    });
  }

  return result;
};

const addForm = async function (req, res, next) {
  const { form, fields } = req.body;

  console.log(form, fields);

  const insert = insertFn(form, fields);

  try {
    const forms = await Form.transaction(async (trx) => {
      await Form.query(trx).insertGraph(insert).returning("*");

      const result = await buildQuery(
        Form.query(trx).withGraphFetched("category"),
        req.body.page,
        req.body.limit
      );

      return result;
    });

    console.log(forms);
    res.status(200).send({ forms });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "POST",
  middleware: [guard.check("add:forms"), validators],
  handler: addForm,
};
