"use strict";
const UserForm = require("$models/UserForm");
const UserFormField = require("$models/UserFormField");
const guard = require("express-jwt-permissions")();
const { param } = require("express-validator");
const { validate } = require("$util");

const adminGetSingleUserForm = async (req, res, next) => {
  const formQuery = UserForm.query()
    .where("id", req.params.id)
    .withGraphJoined(["form.applicant, form.category"])
    .first();

  const fieldsQuery = UserFormField.query()
    .joinRelated("field")
    .where("id", req.params.id)
    .select(
      "id",
      "field.id",
      "field:field.options as options",
      "field:field.value as value",
      "field:field.optional as optional",
      "field:field.type as type",
      "answer"
    );
  try {
    const [form, fields] = await Promise.all([formQuery, fieldsQuery]);

    form.fields = fields;

    res.status(200).send({ form });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/:id",
  method: "GET",
  middleware: [
    guard.check("view:admin", "view:forms"),
    validate([param("id").isNumeric()]),
  ],
  handler: adminGetSingleUserForm,
};
