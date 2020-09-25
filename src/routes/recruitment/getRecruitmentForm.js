"use strict";
const Form = require("$models/Form");
const Category = require("$models/Category");

const guard = require("express-jwt-permissions")();
const { param, query } = require("express-validator");
const { validate } = require("$util");

const validators = validate([param("id").optional().isNumeric().toInt(10)]);

const getRecruitmentForm = async function (req, res, next) {
  let results = {};

  try {
    const categories = await Category.query()
      .joinRelated("forms")
      .select("categories.id", "categories.name")
      .where("forms.status", true)
      .where("recruitment", true);

    const category_id = categories[0].id;

    const form = await Form.query()
      .where({ category_id, status: true })
      .withGraphFetched("fields(order)")
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
  middleware: [
    guard.check(["view:forms"]),
    (req, res, next) => {
      console.log(req.body);
      next();
    },
    validators,
  ],
  handler: getRecruitmentForm,
};
