"use strict";
const UserForm = require("./models/UserForm");

const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate } = require("$util");
const verifyRecaptcha = require("$services/recaptcha")(
  process.env.RECAPTCHA_SECRET
);
const { ADD_OWN_FORM } = require("$util/permissions");

const validators = validate([
  body("form_id").isNumeric(),
  body("category_id").isNumeric(),
  body("fields.*.id").isNumeric(),
  // body("fields.*.value").isString().trim().escape(),
  body("gresponse").isString().escape().trim(),
]);

const insertFn = (form_id, user_id, fields) => {
  const result = {};

  if (form_id) Object.assign(result, { form_id });
  if (user_id) Object.assign(result, { user_id });

  if (fields && fields.length) {
    Object.assign(result, {
      form_fields: fields.map((field) => {
        return {
          field_id: field.id,
          answer: field.value ? JSON.stringify({ value: field.value }) : null,
        };
      }),
    });
  }

  return result;
};

const addForm = async function (req, res, next) {
  const { form_id, fields } = req.body;

  const insert = insertFn(form_id, req.user.id, fields);

  const options = { relate: true };

  try {
    const userAlreadySubmitted = await UserForm.query()
      .joinRelated("[applicant, form]")
      .where("applicant.id", req.user.id)
      .andWhere("form.category_id", req.body.category_id)
      .andWhere("user_forms.status", "pending")
      .first();

    if (userAlreadySubmitted) {
      return res.status(422).send({
        message:
          "You've already submitted an application for this category. Please way for a response.",
      });
    }

    await UserForm.transaction(async (trx) => {
      await UserForm.query(trx).insertGraph(insert, options).returning("*");
    });

    res.status(200).send();
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "POST",
  middleware: [
    guard.check(ADD_OWN_FORM),
    (req, res, next) => {
      console.log(req.body);
      next();
    },
    validators,
    verifyRecaptcha,
  ],
  handler: addForm,
};
