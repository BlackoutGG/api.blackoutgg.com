"use strict";
const Form = require("$models/Form");

const guard = require("express-jwt-permissions")();
const sanitize = require("sanitize-html");
const { body } = require("express-validator");
const { buildQuery, validate } = require("$util");
const { VIEW_ALL_ADMIN, ADD_ALL_FORMS } = require("$util/policies");
const { transaction } = require("objection");

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
    .isString()
    .trim()
    .escape()
    .customSanitizer((v) => sanitize(v)),
  body("nextCursor").optional().isString().escape().trim(),
  // body("page").optional().isNumeric(),
  // body("limit").optional().isNumeric(),
  // body("orderBy").optional().isString().trim().escape(),
  // body("sortBy").optional().isString().trim().escape(),
]);

const insertFn = (id, form, fields) => {
  const result = { creator_id: id };

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

const select = [
  "forms.id",
  "forms.name",
  "forms.status",
  "forms.is_deletable",
  "forms.category_id",
  "created_by.username as creator",
  "forms.created_at",
  "forms.updated_at",
];

const addForm = async function (req, res, next) {
  const { form, fields, filters, nextCursor } = req.body;

  const insert = insertFn(req.user.id, form, fields);

  const trx = await Form.startTransaction();

  try {
    await Form.query(trx).insertGraph(insert);

    // const query = Form.query()
    //   .orderBy("id")
    //   .orderBy("created_at", "desc")
    //   .where("creator_id", req.user.id);

    const query = Form.query()
      .joinRelated("created_by(onlyUsername)")
      .select(select)
      .orderBy("id");

    const forms = await query.clone().cursorPage(nextCursor);

    // const forms = await query.clone().cursorPage();

    await trx.commit();

    console.log(forms);
    res.status(200).send(forms);
  } catch (err) {
    console.log(err);
    await trx.rollback();
  }
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
