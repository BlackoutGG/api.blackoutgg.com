"use strict";
const Form = require("./models/Form");
const guard = require("express-jwt-permissions")();
const { body, param } = require("express-validator");
const { validate } = require("$util");

const setFormStatus = async function (req, res, next) {
  try {
    // const check = await Form.query()
    //   .joinRelated("category")
    //   .select("forms.status", "forms.id", "category.id as category_id")
    //   .where("forms.id", req.params.id)
    //   .first()
    //   .throwIfNotFound();

    const form = await Form.transaction(async (trx) => {
      // await Form.query(trx)
      //   .joinRelated("category")
      //   .patch({ status: false })
      //   .where("status", true)
      //   .where("forms:category.id", req.body.category_id)
      //   .debug();

      await Form.query(trx)
        .patch({ status: false })
        .where("status", true)
        .whereExists(
          Form.relatedQuery("category").where(
            "category.id",
            req.body.category_id
          )
        );

      const query = await Form.query(trx)
        .withGraphFetched("category")
        .patch({ status: !req.body.status })
        .where("forms.id", req.params.id)
        .first()
        .returning(["forms.id", "forms.status"]);

      const result = {
        id: query.id,
        status: query.status,
        category_id: query.category.id,
      };

      return result;
    });

    res.status(200).send({ form });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/:id/status",
  method: "PATCH",
  middleware: [
    guard.check(["view:admin", "update:forms"]),
    validate([
      param("id").isNumeric().toInt(10),
      body("category_id").isNumeric().toInt(10),
      body("status").isBoolean(),
    ]),
  ],
  handler: setFormStatus,
};
