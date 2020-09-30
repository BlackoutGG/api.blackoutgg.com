"use strict";
const Form = require("$models/Form");
const Category = require("$models/Category");

const guard = require("express-jwt-permissions")();
const { param } = require("express-validator");
const { validate } = require("$util");

const validators = validate([param("id").isNumeric().toInt(10)]);

const getRecruitmentFormById = async function (req, res, next) {
  try {
    const form = await Form.query()
      .where("category.id", req.params.id)
      .where("forms.status", true)
      .withGraphJoined("[category(defaultSelects), fields(order)]")
      .select("forms.id", "forms.description", "category.id as category_id")
      .first();

    res.status(200).send({ form });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/:id",
  method: "GET",
  middleware: [
    guard.check(["view:forms"]),
    (req, res, next) => {
      console.log(req.body);
      next();
    },
    validators,
  ],
  handler: getRecruitmentFormById,
};
