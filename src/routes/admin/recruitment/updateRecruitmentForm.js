"use strict";
const UserForm = require("$models/UserForm");
const UserRole = require("$models/UserRole");
const redis = require("$services/redis");
const guard = require("express-jwt-permissions")();
const { param, body } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, UPDATE_ALL_FORMS } = require("$util/policies");
const { transaction } = require("objection");

const validators = validate([
  param("id").isNumeric().toInt(10),
  body("details.status").isIn(["pending", "accepted", "rejected"]),
]);

const select = [
  "user_forms.id",
  "user_forms.status",
  "user_forms.created_at",
  "user_forms.updated_at",
  "form.name",
  "form:category.id as category_id",
  "form:category.name as category_name",
];

const updateRecruitmentForm = async (req, res, next) => {
  const trx = await UserForm.startTransaction();

  try {
    await UserForm.query(trx)
      .patch(req.body.details)
      .where("id", req.params.id);

    const form = await UserForm.query()
      .joinRelated("form.[category]")
      .withGraphFetched("applicant(defaultSelects)")
      .where("user_forms.id", req.params.id)
      .select(select)
      .first();

    if (req.body.details.status === "accepted") {
      /** PATCH GUEST(id: 3) TO MEMBER (id: 2) */
      await UserRole.query(trx)
        .patch({ role_id: 2 })
        .where("user_id", form.applicant.id)
        .where("role_id", 3);
    }

    await redis.del(`r_form_${form.category.id}`);

    res.status(200).send(form);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/:id",
  method: "PATCH",
  middleware: [guard.check([VIEW_ALL_ADMIN, UPDATE_ALL_FORMS]), validators],
  handler: updateRecruitmentForm,
};
