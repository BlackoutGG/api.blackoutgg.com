"use strict";
const Form = require("$models/Form");
const Category = require("$models/Category");

const guard = require("express-jwt-permissions")();
const { param, query } = require("express-validator");
const { validate } = require("$util");

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

    const form = await Form.query()
      .where("category.id", category_id)
      .where("forms.status", true)
      .withGraphJoined("[category, fields(order)]")
      .select(
        "forms.id",
        "forms.name",
        "forms.description",
        "category.id as category_id"
      )
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
  middleware: [guard.check(["view:forms"]), validators],
  handler: getRecruitmentForm,
};
