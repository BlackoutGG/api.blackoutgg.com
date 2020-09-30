"use strict";
const UserForm = require("$models/UserForm");
const UserFormField = require("$models/UserFormField");
const guard = require("express-jwt-permissions")();
const { param } = require("express-validator");
const { validate } = require("$util");

const formSelect = [
  "user_forms.id",
  "user_forms.status",
  "form:category.name as category_name",
];

const fieldSelect = [
  "user_form_fields.id",
  "user_form_fields.answer",
  "field.options",
  "field.value",
  "field.optional",
  "field.type",
];

const adminGetSingleUserForm = async (req, res, next) => {
  const formQuery = UserForm.query()
    .where("user_forms.id", req.params.id)
    .joinRelated("form.[category]")
    .withGraphFetched("applicant(defaultSelects)")
    .select(formSelect)
    .first();

  const fieldsQuery = UserFormField.query()
    .joinRelated("field")
    .where("user_form_fields.form_id", req.params.id)
    .select(fieldSelect)
    .orderBy("field.order");

  try {
    const [form, fields] = await Promise.all([formQuery, fieldsQuery]);

    form.fields = fields;

    res.status(200).send({ form });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/:id",
  method: "GET",
  middleware: [
    guard.check("view:admin", "view:forms"),
    validate([param("id").isNumeric().toInt(10)]),
  ],
  handler: adminGetSingleUserForm,
};
