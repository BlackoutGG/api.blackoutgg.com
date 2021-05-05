"use strict";
const Form = require("$models/Form");
const UserForm = require("$models/UserForm");
const Category = require("$models/Category");

const guard = require("express-jwt-permissions")();
const { param, query } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_FORMS } = require("$util/permissions");

const validators = validate([param("id").isNumeric().toInt(10)]);

const getRecruitmentFormById = async function (req, res, next) {
  try {
    // const form = await Form.query()
    //   .where("category.id", req.params.id)
    //   .where("forms.status", true)
    //   .withGraphJoined("[category(defaultSelects), fields(order)]")
    //   .select("forms.id", "forms.description", "category.id as category_id")
    //   .first();

    const userAlreadySubmitted = await UserForm.query()
      .joinRelated("[applicant, form]")
      .where("applicant.id", req.user.id)
      .andWhere("form.category_id", req.params.id)
      .andWhere("user_forms.status", "pending")
      .first();

    if (userAlreadySubmitted) {
      return res.status(203).send({
        message:
          "You've already submitted an application for this category. Please way for a response.",
      });
    }

    const form = await Form.query()
      .where("category_id", req.params.id)
      .where("status", true)
      .withGraphFetched("[category(defaultSelects), fields(order)]")
      .select("forms.id", "forms.description", "category_id")
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
    guard.check([VIEW_ALL_FORMS]),
    (req, res, next) => {
      console.log(req.body);
      next();
    },
    validators,
  ],
  handler: getRecruitmentFormById,
};
