"use strict";
const Form = require("./models/Form");

const guard = require("express-jwt-permissions")();
const sanitize = require("sanitize-html");
const { body } = require("express-validator");
const { buildQuery, validate } = require("$util");
const { VIEW_ALL_ADMIN, ADD_ALL_FORMS } = require("$util/policies");

const validators = validate([
  body("form.category_id").isNumeric(),
  body("form.name")
    .isString()
    .trim()
    .escape()
    .customSanitizer((v) => sanitize(v)),
  body("form.description")
    .isString()
    .trim()
    .escape()
    .customSanitizer((v) => sanitize(v)),
  // body("fields.*.order").isNumeric(),
  // body("fields.*.type").isAlphanumeric().trim().escape(),
  // body("fields.*.optional").isBoolean(),
  body("fields.*.value")
    .isAlphanumeric()
    .trim()
    .escape()
    .customSanitizer((v) => sanitize(v)),
  body("page").optional().isNumeric(),
  body("limit").optional().isNumeric(),
  body("orderBy").optional().isString().trim().escape(),
  body("sortBy").optional().isString().trim().escape(),
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
  const { form, fields, filters } = req.body;

  const insert = insertFn(form, fields);

  const forms = await Form.transaction(async (trx) => {
    await Form.query(trx).insertGraph(insert).returning("*");

    const result = await buildQuery(
      Form.query(trx).withGraphFetched("category"),
      req.body.page,
      req.body.limit,
      null,
      null,
      filters
    );

    return result;
  });

  console.log(forms);
  res.status(200).send({ forms });
};

module.exports = {
  path: "/",
  method: "POST",
  middleware: [
    guard.check([VIEW_ALL_ADMIN, ADD_ALL_FORMS]),
    (req, res, next) => {
      console.log(req.body);
      next();
    },
    validators,
  ],
  handler: addForm,
};
