"use strict";
const Form = require("$models/Form");
const Category = require("$models/Category");

const guard = require("express-jwt-permissions")();
const { param, query } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  param("id").optional().isNumeric().toInt(10),
  // query("populateCategories").optional().isBoolean(),
]);

const formQuery = (id) =>
  Form.query()
    .where({ category_id: id, status: true })
    .withGraphFetched("fields(order)")
    .select("id", "name", "description", "category_id")
    .first();

const getRecruitmentForm = async function (req, res, next) {
  let query,
    results = {};

  try {
    if (req.params.id) {
      const categories = await Category.query().where("recruitment", true);
      query = formQuery(req.params.id);
      Object.assign(results, { categories });
    } else {
      const categories = await Category.query()
        .where("recruitment", true)
        .select("id", "name");

      console.log(categories);

      const category_id = categories[0].id;
      query = formQuery(category_id);

      Object.assign(results, { categories, category_id });
    }

    const form = await query;
    // const [form, categories] = await Promise.all([
    // Form.query()
    //   .where({ category_id: req.params.id, status: true })
    //   .withGraphFetched("fields(order)")
    //   .select("id", "name", "description", "category_id")
    //   .first(),
    //     req.query.populateCategories
    //       ? Category.query().where("recruitment", true)
    //       : Promise.resolve(null),
    //   ]);
    res.status(200).send({ form, ...results });
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
    // validators,
  ],
  handler: getRecruitmentForm,
};
