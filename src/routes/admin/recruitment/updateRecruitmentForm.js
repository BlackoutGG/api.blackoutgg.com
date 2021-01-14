"use strict";
const UserForm = require("$models/UserForm");
const UserRole = require("$models/UserRole");
const guard = require("express-jwt-permissions")();
const { param, body } = require("express-validator");
const { validate } = require("$util");

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
  try {
    const form = await UserForm.transaction(async (trx) => {
      await UserForm.query(trx)
        .patch(req.body.details)
        .where("id", req.params.id);

      const result = await UserForm.query(trx)
        .joinRelated("form.[category]")
        .withGraphFetched("applicant(defaultSelects)")
        .where("user_forms.id", req.params.id)
        .select(select)
        .first();

      if (req.body.details.status === "accepted") {
        /** PATCH GUEST(id: 3) TO MEMBER (id: 2) */
        await UserRole.query(trx)
          .patch({ role_id: 2 })
          .where("user_id", result.applicant.id)
          .where("role_id", 3);
      }
      return result;
    });

    console.log(form);

    res.status(200).send({ form });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/:id",
  method: "PATCH",
  middleware: [guard.check(["view:admin", "update:forms"]), validators],
  handler: updateRecruitmentForm,
};
