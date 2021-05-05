"use strict";
const Form = require("$models/Form");
const Category = require("$models/Category");
const UserForm = require("$models/UserForm");

const guard = require("express-jwt-permissions")();
const { param, query } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_FORMS } = require("$util/permissions");

const validators = validate([param("id").optional().isNumeric().toInt(10)]);

const getRecruitmentForm = async function (req, res, next) {
  try {
    const categories = await Category.query()
      .joinRelated("forms")
      .select("categories.id", "categories.name")
      .where("forms.status", true)
      .where("recruitment", true)
      .throwIfNotFound();

    const category_id = categories[0].id;

    const userAlreadySubmitted = await UserForm.query()
      .joinRelated("[applicant, form]")
      .where("applicant.id", req.user.id)
      .andWhere("form.category_id", category_id)
      .andWhere("user_forms.status", "pending")
      .first();

    if (userAlreadySubmitted) {
      return res.status(203).send({
        categories,
        category_id,
        message:
          "You've already submitted an application for this category. Please way for a response.",
      });
    }

    // const form = await Form.query()
    //   .where("category.id", category_id)
    //   .where("forms.status", true)
    //   .withGraphJoined("[category, fields(order)]")
    //   .select(
    //     "forms.id",
    //     "forms.name",
    //     "forms.description",
    //     "category.id as category_id"
    //   )
    //   .first();

    const form = await Form.query()
      .where("category_id", category_id)
      .where("forms.status", true)
      .withGraphFetched("[category(defaultSelects), fields(order)]")
      .select("id", "name", "description", "category_id")
      .first();

    res.status(200).send({ form, categories, category_id });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [guard.check([VIEW_ALL_FORMS]), validators],
  handler: getRecruitmentForm,
};
