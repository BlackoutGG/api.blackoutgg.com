"use strict";
const Form = require("./models/Form");

const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { buildQuery } = require("$util");

const deleteForm = async function (req, res, next) {
  try {
    const [form, forms] = await Promise.all([
      Form.query().where("id", req.params.id).del().first().returning(),
      buildQuery(
        Form.query().withGraphFetched("category"),
        req.query.page,
        req.query.limit
      ),
    ]);

    res.status(200).send({ forms });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/template/:id/delete",
  method: "DELETE",
  middleware: [
    (req, res, next) => {
      console.log(req.body);
      next();
    },
  ],
  handler: deleteForm,
};
