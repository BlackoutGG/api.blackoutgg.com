"use strict";
const Form = require("./models/Form");

const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { buildQuery, validate } = require("$util");

const deleteForm = async function (req, res, next) {
  try {
    const results = await Form.transaction(async (trx) => {
      const deleted = await Form.query(trx)
        .whereIn("id", req.body.ids)
        .del()
        .first()
        .returning("id");

      const query = Form.query(trx).withGraphFetched("category(selectBanner)");

      const forms = await buildQuery(query, req.query.page, req.query.limit);

      return { forms, deleted };
    });

    res.status(200).send(results);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/:id/delete",
  method: "DELETE",
  middleware: [
    (req, res, next) => {
      console.log(req.body);
      next();
    },
    guard.check(["view:admin", "delete:forms"]),
    validate([body("ids.*").isNumeric()]),
  ],
  handler: deleteForm,
};
