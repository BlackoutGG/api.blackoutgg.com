"use strict";
const Form = require("./models/Form");

const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { buildQuery } = require("$util");

const insertFn = (form, fields) => {
  return {
    "#id": "form",
    ...form,
    fields: fields.map((field, idx) => {
      const { options, ..._field } = field;
      const parent = "input" + idx;
      const result = {
        "#id": parent,
        ..._field,
        form: {
          form_id: "#ref{form.id}",
          field_id: `#{ref${parent}.id}`,
        },
      };

      if (options && options.length) {
        // const opts = options.map((o) => ({
        //   field_parent_id: `#{ref${parent}.id}`,
        //   value: o.value,
        // }));

        Object.assign(result, { options: JSON.stringify(options) });
      }

      return result;
    }),
  };
};

const addForm = async function (req, res, next) {
  const { form, fields } = req.body;

  try {
    const forms = await Form.transaction(async (trx) => {
      await Form.query(trx)
        .insertGraph(insertFn(form, fields), {
          allowRefs: true,
        })
        .returning("*");

      const result = await buildQuery.call(
        Form.query(trx).returning("*"),
        req.body.page,
        req.body.limit
      );

      return result;
    });

    console.log(forms);
    res.status(200).send({ forms });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/template",
  method: "POST",
  middleware: [
    (req, res, next) => {
      console.log(req.body);
      next();
    },
  ],
  handler: addForm,
};
