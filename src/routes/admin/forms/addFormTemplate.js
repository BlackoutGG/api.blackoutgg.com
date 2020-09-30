"use strict";
const Form = require("./models/Form");

const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { buildQuery, validate } = require("$util");

const validators = validate([
  body("form.category_id").isNumeric(),
  body("form.name").isString().trim().escape(),
  body("form.description").isString().trim().escape(),
  // body("fields.*.order").isNumeric(),
  // body("fields.*.type").isAlphanumeric().trim().escape(),
  // body("fields.*.optional").isBoolean(),
  // body("fields.*.value").isAlphanumeric().trim().escape(),
  body("page").optional().isNumeric(),
  body("limit").optional().isNumeric(),
  body("orderBy").optional().isString().trim().escape(),
  body("sortBy").optional().isString().trim().escape(),
]);

const insertFn = (f, fields) => {
  const { category_id, ...form } = f;
  const result = {};

  if (form && Object.keys(form).length) {
    Object.assign(result, { "#id": "form" }, form);
  }

  if (category_id) {
    const form_category = { category_id };
    Object.assign(result, { form_category });
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
  middleware: [
    guard.check(["view:admin", "add:forms"]),
    (req, res, next) => {
      console.log(req.body);
      next();
    },
    validators,
  ],
  handler: addForm,
};
