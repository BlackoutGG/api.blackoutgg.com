"use strict";
const Form = require("$models/Form");

const guard = require("express-jwt-permissions")();
const redis = require("$services/redis");
const { query } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, DELETE_ALL_FORMS } = require("$util/policies");
const { transaction } = require("objection");

const removeForm = async function (req, res, next) {
  try {
    const deleted = await Form.query(trx)
      .whereIn("id", req.query.ids)
      .del()
      .returning("id");

    const pipeline = redis.pipeline();

    req.query.ids.forEach((id) => pipeline.del(`form_${id}`));

    pipeline.exec();
    await trx.commit();

    res.status(200).send(deleted);
  } catch (err) {
    await trx.rollback();
    next(err);
  }

  const deleted = await Form.query(trx)
    .whereIn("id", req.query.ids)
    .del()
    .first()
    .returning("id");

  res.status(200).send(results);
};

module.exports = {
  path: "/",
  method: "DELETE",
  middleware: [
    (req, res, next) => {
      console.log(req.body);
      next();
    },
    guard.check([VIEW_ALL_ADMIN, DELETE_ALL_FORMS]),
    validate([query("ids.*").isNumeric()]),
  ],
  handler: removeForm,
};
