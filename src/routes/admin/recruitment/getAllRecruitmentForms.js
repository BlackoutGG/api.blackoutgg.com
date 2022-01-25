"use strict";
const UserForm = require("$models/UserForm");
const Category = require("$models/Category");
const guard = require("express-jwt-permissions")();
const filterQuery = require("$util/filterQuery");
const getCache = require("$util/getCache");

const { query } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, VIEW_ALL_FORMS } = require("$util/policies");

const select = [
  "user_forms.id",
  "user_forms.status",
  "user_forms.created_at",
  "user_forms.updated_at",
  "form.name",
  "form:category.id as category_id",
  "form:category.name as category_name",
];

const validators = validate([
  query("isInitial").optional().isBoolean().default(false),
  query("nextCursor").optional().isString().escape().trim(),
]);

const getAllRecruitmentForm = async (req, res, next) => {
  const filters = req.query.filters || null,
    isInitial = req.query.isInitial,
    nextCursor = req.query.nextCursor;

  const formQuery = filterQuery(
    UserForm.query()
      .joinRelated("form.[category]")
      .withGraphFetched("applicant(defaultSelects)")
      .select(select),
    filters
  );

  let response = {};
  let forms;

  if (isInitial) {
    Object.assign(response, {
      categories: await getCache(
        "form_categories",
        Category.query()
          .where("enable_recruitment", true)
          .select(["id", "name"])
      ),
    });
  }

  if (nextCursor) {
    forms = await formQuery.clone().cursorPage(nextCursor);
  } else {
    forms = await formQuery.clone().cursorPage();
  }

  Object.assign(response, { forms });

  res.status(200).send(response);
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [guard.check([VIEW_ALL_ADMIN, VIEW_ALL_FORMS]), validators],
  handler: getAllRecruitmentForm,
};
