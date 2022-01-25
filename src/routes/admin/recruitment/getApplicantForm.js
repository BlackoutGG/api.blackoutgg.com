"use strict";
const UserForm = require("$models/UserForm");
const guard = require("express-jwt-permissions")();
const getCache = require("$util/getCache");
const { param } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, VIEW_ALL_FORMS } = require("$util/policies");

const select = [
  "user_forms.id",
  "user_forms.status",
  "form:category.name",
  "form_fields.field_id as id",
  "form_fields.answer",
  "form_fields.options",
  "form_fields.value",
  "form_fields.optional",
  "form_fields.type",
  "applicant.username",
  "applicant.avatar",
];

const getApplicantForm = async (req, res, next) => {
  const form = await getCache(
    `r_form_${req.params.id}`,
    UserForm.query()
      .withGraphFetched(
        "[form.[category(returnName)], fields(order), applicant(defaultSelects)]"
      )
      .select([
        "user_forms.id",
        "user_forms.status",
        "user_forms.created_at",
        "user_forms.updated_at",
      ])
      .where("user_forms.id", req.params.id)
      .first()
  );

  console.log(form);

  res.status(200).send(form);
};

module.exports = {
  path: "/:id",
  method: "GET",
  middleware: [
    guard.check([VIEW_ALL_ADMIN, VIEW_ALL_FORMS]),
    validate([param("id").isNumeric().toInt(10)]),
  ],
  handler: getApplicantForm,
};
