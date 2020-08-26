"use strict";
const Form = require("../models/Form");
const Field = require("../models/Field");

const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate } = require("$util");
const pick = require("lodash/pick");

const validators = validate([
  body("form.*.name").optional().isAlphanumeric().trim().escape(),
  body("form.*.category_id").optional().isNumeric(),
  body("form.*.description").optional().isString().trim().escape(),
  body("create.*.optional").optional().isBoolean(),
  body("create.*.order").optional().isNumeric(),
  body("create.*.value").optional().isAlphanumeric().trim().escape(),
  body("create.*.type")
    .optional()
    .isIn(["textfield", "textarea", "multiple", "select", "checkbox"]),
  body("patch.*.id").optional().isNumeric(),
  body("patch.*.value").optional().isAlphanumeric().trim().escape(),
  body("patch.*.optional").optional().isBoolean(),
  body("patch.*.order").optional().isNumeric(),
  body("patch.*.type")
    .optional()
    .isIn(["textfield", "textarea", "multiple", "select", "checkbox"]),
  body("remove.*").optional().isNumeric(),
]);

const consoleRequest = (req, res, next) => {
  console.log(req.body);
  next();
};

const upsert = (id, form, create, patch) => {
  let result = { id };
  let fields = [];

  if (form && Object.keys(form).length) {
    if (form.category_id) form.status = false;
    Object.assign(result, form);
  }

  if (create && create.length) {
    fields = fields.concat(create);
  }

  if (patch && patch.length) {
    fields = fields.concat(patch);
  }

  if (fields && fields.length) {
    fields = fields.map((field) => {
      if (field.options) {
        if (field.options.length) {
          field.options = JSON.stringify(field.options);
        } else {
          field.options = null;
        }
      }

      return field;
    });

    Object.assign(result, { fields });
  }
  return result;
};

const editForm = async function (req, res, next) {
  const { form, create, patch, remove } = req.body;

  const up = upsert(parseInt(req.params.id, 10), form, create, patch);

  console.log(up);

  try {
    const forms = await Form.transaction(async (trx) => {
      const result = await Form.query(trx)
        .upsertGraph(up, {
          noDelete: true,
        })
        .first()
        .returning("*")
        .withGraphFetched("category(selectBanner)");

      if (remove && remove.length) {
        await Field.query(trx).whereIn("id", remove).del().returning("*");
      }

      return pick(result, ["name", "description", "category", "updated_at"]);
    });

    console.log(forms);
    res.status(200).send({ forms });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/:id/edit",
  method: "PUT",
  middleware: [consoleRequest],
  handler: editForm,
};
