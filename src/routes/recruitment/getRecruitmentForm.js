"use strict";
const Form = require("$models/Form");
const Category = require("$models/Category");
const UserForm = require("$models/UserForm");
const getCache = require("$util/getCache");
const guard = require("express-jwt-permissions")();
const { param, query } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_FORMS } = require("$util/policies");

const validators = validate([param("id").optional().isNumeric().toInt(10)]);

const columns = ["id", "name", "description", "category_id"];

const getRecruitmentForm = async function (req, res, next) {
  let response = {};

  let category_id;

  const categoryQuery = Category.query()
    .joinRelated("forms")
    .select("categories.id", "categories.name")
    .where("forms.status", true)
    .where("categories.enable_recruitment", true)
    .throwIfNotFound();

  if (!req.params.id) {
    const categories = await getCache("recruit_categories", categoryQuery);
    category_id = categories[0].id;
    Object.assign(response, { category_id, categories });
  } else {
    category_id = req.params.id;
  }

  const userAlreadySubmitted = await UserForm.query()
    .joinRelated("[applicant, form]")
    .where("applicant.id", req.user.id)
    .andWhere("form.category_id", category_id)
    .andWhere("user_forms.status", "pending")
    .first();

  if (userAlreadySubmitted) {
    const categories = await getCache("recruit_categories", categoryQuery);
    return res.status(203).send({
      categories,
      category_id,
      message:
        "You've already submitted an application for this category. We'll get back to you with a respone soon.",
    });
  }

  Object.assign(response, {
    form: await getCache(
      `r_form_${category_id}`,
      Form.query()
        .where("category_id", category_id)
        .where("forms.status", true)
        .withGraphFetched("[category(defaultSelects), fields(order)]")
        .select(columns)
        .first()
    ),
  });

  res.status(200).send(response);
};

module.exports = {
  path: "/:id?",
  method: "GET",
  middleware: [guard.check([VIEW_ALL_FORMS]), validators],
  handler: getRecruitmentForm,
};
