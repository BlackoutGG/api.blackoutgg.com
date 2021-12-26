"use strict";
const Form = require("$models/Form");
const guard = require("express-jwt-permissions")();
const { body, param } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, UPDATE_ALL_FORMS } = require("$util/policies");
const redis = require("$services/redis");

const setFormStatus = async function (req, res, next) {
  const check = await Form.query()
    .where("id", req.params.id)
    .select(["status", "id", "category_id"])
    .first()
    .throwIfNotFound();

  const form = await Form.transaction(async (trx) => {
    await Form.query(trx)
      .patch({ status: false })
      .where({ status: true, category_id: check.category_id });
    const result = await Form.query(trx)
      .patch({ status: !check.status })
      .where("id", check.id)
      .first()
      .returning(["id", "category_id", "status"]);

    await redis.del(`form_${req.params.id}`);
    await redis.del("recruit_categories");

    return result;
  });

  res.status(200).send({ form });
};

module.exports = {
  path: "/:id/status",
  method: "PATCH",
  middleware: [
    guard.check([VIEW_ALL_ADMIN, UPDATE_ALL_FORMS]),
    validate([
      param("id").isNumeric().toInt(10),
      body("category_id").isNumeric().toInt(10),
      body("status").isBoolean(),
    ]),
  ],
  handler: setFormStatus,
};
