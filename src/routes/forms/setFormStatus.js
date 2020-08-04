"use strict";
const Form = require("./models/Form");
const guard = require("express-jwt-permissions")();
const { body, param } = require("express-validator");
const { validate } = require("$util");

const setFormStatus = async function (req, res, next) {
  try {
    const form = await Form.transaction(async (trx) => {
      await Form.query(trx)
        .patch({ status: null })
        .where({ status: true, category_id: req.body.category_id });
      const result = await Form.query(trx)
        .patch({ status: req.body.status })
        .where("id", parseInt(req.params.id, 10))
        .first()
        .returning(["id", "category_id", "status"]);

      return result;
    });

    res.status(200).send({ form });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/status",
  method: "PUT",
  middleware: [
    guard.check("users:view"),
    validate([
      body("category_id").isNumeric(),
      body("status").isBoolean(),
      param("id").isNumeric(),
    ]),
  ],
  handler: setFormStatus,
};
