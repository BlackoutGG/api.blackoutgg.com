"use strict";
const Form = require("./models/Form");
const guard = require("express-jwt-permissions")();
const { query, param } = require("express-validator");
const { validate } = require("$util");

const validators = validate([param("id").isNumeric().toInt(10)]);

// const getSingleForm = async function (req, res, next) {
//   try {
//     const form = await Form.query()
//       .joinRelated("category")
//       .withGraphFetched("fields(order)")
//       .select(
//         "forms.id",
//         "forms.name",
//         "forms.description",
//         "category.id as category_id"
//       )
//       .where("forms.id", req.params.id)
//       .first()
//       .throwIfNotFound();

//     console.log(form);

//     res.status(200).send({ form });
//   } catch (err) {
//     console.log(err);
//     next(err);
//   }
// };

const getSingleForm = async function (req, res, next) {
  const form = await Form.query()
    .withGraphFetched("[category(defaultSelects), fields(order)]")
    .select("id", "name", "description", "category_id")
    .where("id", req.params.id)
    .first()
    .throwIfNotFound();

  res.status(200).send({ form });

  // try {
  //   const form = await Form.query()
  //     .withGraphFetched("[category(defaultSelects), fields(order)]")
  //     .select("id", "name", "description", "category_id")
  //     .where("id", req.params.id)
  //     .first()
  //     .throwIfNotFound();

  //   res.status(200).send({ form });
  // } catch (err) {
  //   console.log(err);
  //   next(err);
  // }
};

module.exports = {
  path: "/:id",
  method: "GET",
  middleware: [guard.check(["view:admin", "view:forms"]), validators],
  handler: getSingleForm,
};
