"use strict";
const Category = require("./models/Category");
const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate, buildQuery } = require("$util");

const validators = validate([
  body("name").isAlphanumeric().escape().trim(),
  body("page").isNumeric(),
  body("limit").isNumeric(),
]);

const addCategory = async function (req, res, next) {
  const categories = await Category.transaction(async (trx) => {
    await Category.query(trx).insert({ name: req.body.name });
    const results = await buildQuery(
      Category.query(trx),
      req.body.page,
      req.body.limit
    );
    return results;
  });
  res.status(200).send({ categories });

  // try {
  //   const categories = await Category.transaction(async (trx) => {
  //     await Category.query(trx).insert({ name: req.body.name });
  //     const results = await buildQuery(
  //       Category.query(trx),
  //       req.body.page,
  //       req.body.limit
  //     );
  //     return results;
  //   });
  //   res.status(200).send({ categories });
  // } catch (err) {
  //   console.log(err);
  //   next(err);
  // }
};

module.exports = {
  path: "/",
  method: "POST",
  middleware: [guard.check("view:admin"), validators],
  handler: addCategory,
};