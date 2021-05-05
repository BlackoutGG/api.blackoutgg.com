"use strict";

const Testimony = require("$models/Testimony");
const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  body("testimonies.*.id").isNumeric().toInt(10),
  body("testimonies.*.order").isNumeric().toInt(10),
]);

const middleware = [guard.check("update:frontpage"), validators];

const patchTestimony = async function (req, res) {
  const testimonies = await Testimony.transaction(async (trx) => {
    const results = await Testimony.query(trx).upsertGraph(
      req.body.testimonies,
      { relate: false, noDelete: true }
    );

    return results;
  });

  res.status(200).send({ status: true });
};

module.exports = {
  path: "/testimony/order",
  method: "PATCH",
  middleware,
  handler: patchTestimony,
};
