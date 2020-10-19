"use strict";
const Form = require("./models/Form");
const Field = require("./models/Field");

const guard = require("express-jwt-permissions")();
const { body, param } = require("express-validator");
const { validate } = require("$util");
const pick = require("lodash/pick");

const validators = validate([
  param("id").isNumeric().toInt(10),
  body("details.name").optional().isAlphanumeric().trim().escape(),
  body("details.category_id").optional().isNumeric(),
  body("details.description").optional().isString().trim().escape(),
  body("added.*.optional").optional().isBoolean(),
  body("added.*.order").optional().isNumeric(),
  body("added.*.value").optional().isString().trim().escape(),
  body("added.*.type")
    .optional()
    .isIn(["textfield", "textarea", "multiple", "select", "checkbox"]),
  body("update.*.id").optional().isNumeric(),
  body("update.*.value").optional().isAlphanumeric().trim().escape(),
  body("update.*.optional").optional().isBoolean(),
  body("update.*.order").optional().isNumeric(),
  body("update.*.type")
    .optional()
    .isIn(["textfield", "textarea", "multiple", "select", "checkbox"]),
  body("remove.*").optional().isNumeric(),
]);

const consoleRequest = (req, res, next) => {
  console.log(req.body);
  next();
};

const upsert = (id, details, added, update) => {
  let result = { id, updated_at: new Date().toISOString() };
  let fields = [];

  if (details && Object.keys(details).length) {
    if (details.category_id) details.status = false;
    Object.assign(result, details);
  }

  if (added && added.length) {
    fields = fields.concat(added);
  }

  if (update && update.length) {
    fields = fields.concat(update);
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
  const { details, added, update, remove } = req.body;

  const up = upsert(req.params.id, details, added, update);

  try {
    const form = await Form.transaction(async (trx) => {
      let result = await Form.query(trx)
        .upsertGraph(up, {
          noDelete: true,
        })
        .first()
        .returning("*");

      if (remove && remove.length) {
        await Field.query(trx).whereIn("id", remove).del().returning("*");
        if (!details && !added && !update) {
          result = await Form.query(trx)
            .patch({
              updated_at: new Date().toISOString(),
            })
            .returning("*");
        }
      }

      // return pick(result, [
      //   "name",
      //   "status",
      //   "category",
      //   "created_at",
      //   "updated_at",
      // ]);

      return result;
    });

    res.status(200).send({ form });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/:id",
  method: "PATCH",
  middleware: [
    consoleRequest,
    guard.check(["view:admin", "update:forms"]),
    validators,
  ],
  handler: editForm,
};
