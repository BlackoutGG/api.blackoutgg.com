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

const editForm = async function (req, res, next) {
  const { form, create, patch, remove } = req.body;

  try {
    const forms = await Form.transaction(async (trx) => {
      let result;

      if (form && Object.keys(form).length) {
        result = await Form.query(trx).patch(form).where("id", req.params.id);
      }

      if (create && create.length) {
        const fields = await Field.query(trx).insert(create).returning("*");
        await FormFields.query(trx).insert(
          fields
            .map((field) => ({
              form_id: req.params.id,
              field_id: field.id,
            }))
            .returning("*")
        );
      }

      if (patch && patch.length) {
        const queries = patch.map((p) => {
          const { id, ...field } = p;
          return Field.query(trx).patch(field).where("id", id).returning("*");
        });

        await Promise.all(queries);
      }

      if (remove && remove.length) {
        await Field.query(trx).whereIn("id", remove).del().returning("*");
      }

      return result
        ? { name: result.name, category: result.category }
        : { success: true };
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
