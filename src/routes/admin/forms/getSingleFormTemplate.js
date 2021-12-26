"use strict";
const Form = require("$models/Form");
const guard = require("express-jwt-permissions")();
const getCache = require("$util/getCache");
const { param } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, VIEW_ALL_FORMS } = require("$util/policies");

const validators = validate([param("id").isNumeric().toInt(10)]);

const getSingleForm = async function (req, res, next) {
  const form = await getCache(
    `form_${req.params.id}`,
    Form.query()
      .withGraphFetched("[category(defaultSelects), fields(order)]")
      .select("id", "name", "description", "category_id")
      .where("id", req.params.id)
      .first()
      .throwIfNotFound()
  );

  res.status(200).send(form);
};

module.exports = {
  path: "/:id",
  method: "GET",
  middleware: [guard.check([VIEW_ALL_ADMIN, VIEW_ALL_FORMS]), validators],
  handler: getSingleForm,
};
