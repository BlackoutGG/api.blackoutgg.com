"use strict";
const Form = require("./models/Form");
const Field = require("./models/Field");
const FormFields = require("./models/FormFields");

const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");

const consoleRequest = (req, res, next) => {
  console.log(req.body);
  next();
};

const upsert = (id, form, create, patch) => {
  let result = {};
  let fields = [];

  if (form && Object.keys(form).length) {
    Object.assign(result, { "#id": "form", id }, form);
  }

  if (create && create.length) {
    fields = form
      ? fields.concat(create)
      : fields.concat(
          create.map((field) => {
            field["#id"] = "formField";
            field.form = {
              form_id: id,
            };
            return field;
          })
        );
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

    if (result.form) {
      Object.assign(result, { fields });
    } else {
      result = fields;
    }
  }
  return result;
};

const editForm = async function (req, res, next) {
  const { form, create, patch, remove } = req.body;

  const up = upsert(parseInt(req.params.id, 10), form, create, patch);

  console.log(up);

  try {
    const forms = await Form.transaction(async (trx) => {
      let f;

      if (form && Object.keys(form).length) {
        f = await Form.query(trx)
          .upsertGraph(up, {
            noDelete: true,
          })
          .returning("*")
          .withGraphFetched("category(selectBanner)");
      } else {
        await Field.query(trx)
          .upsertGraph(up, { noDelete: true, relate: true })
          .returning("*");
      }

      if (remove && remove.length) {
        deleted = await Fields.query(trx)
          .whereIn("id", remove)
          .del()
          .returning("*");
      }

      return f ? { name: f.name, category: f.category } : { success: true };
    });

    console.log(forms);
    res.status(200).send({ forms });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/edit/:id",
  method: "PUT",
  middleware: [consoleRequest],
  handler: editForm,
};
