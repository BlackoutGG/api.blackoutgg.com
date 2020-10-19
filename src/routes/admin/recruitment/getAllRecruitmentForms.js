"use strict";
const UserForm = require("$models/UserForm");
const Category = require("$models/Category");
const guard = require("express-jwt-permissions")();
const { buildQuery, validate } = require("$util");

const select = [
  "user_forms.id",
  "user_forms.status",
  "user_forms.created_at",
  "user_forms.updated_at",
  "form.name",
  "form:category.id as category_id",
  "form:category.name as category_name",
];

const getAllRecruitmentForm = async (req, res, next) => {
  const filters = req.query.filters || null;

  const formQuery = UserForm.query()
    .joinRelated("form.[category]")
    .withGraphFetched("applicant(defaultSelects)")
    .select(select);

  const categoryQuery = Category.query().where("recruitment", true);

  try {
    const [forms, categories] = await Promise.all([
      buildQuery(
        formQuery,
        req.query.page,
        req.query.limit,
        null,
        null,
        filters
      ),
      categoryQuery,
    ]);

    res.status(200).send({ forms, categories });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [guard.check("view:forms")],
  handler: getAllRecruitmentForm,
};
