"use strict";
const Form = require("$models/Form");
const getCache = require("$util/getCache");
const guard = require("express-jwt-permissions")();
const sanitize = require("sanitize-html");
const filterQuery = require("$util/filterQuery");
const { query } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, VIEW_ALL_FORMS } = require("$util/policies");

const select = [
  "forms.id",
  "forms.name",
  "forms.status",
  "forms.is_deletable",
  "forms.category_id",
  "created_by.username as creator",
  "forms.created_at",
  "forms.updated_at",
];

const getAllFormTemplates = async function (req, res, next) {
  const filters = req.query.filters || null,
    nextCursor = req.query.nextCursor,
    isInitial = req.query.isInitial;

  let response = {};

  if (isInitial) {
    Object.assign(response, {
      categories: await getCache(
        "categories",
        Category.query()
          .where("enable_recruitment", true)
          .select(["id", "name"])
      ),
    });
  }

  let formQuery = filterQuery(
    Form.query()
      .joinRelated("created_by(onlyUsername)")
      .select(select)
      .orderBy("id"),
    filters
  );
  let forms;

  if (nextCursor) forms = await formQuery.clone().cursorPage(nextCursor);
  else forms = await formQuery.clone().cursorPage();
  console.log(forms);

  Object.assign(response, { forms });

  res.status(200).send(response);
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [
    guard.check([VIEW_ALL_ADMIN, VIEW_ALL_FORMS]),
    validate([
      query("isInitial").isBoolean().default(true),
      query("nextCursor")
        .optional()
        .isString()
        .customSanitizer((v) => sanitize(v)),
      query("prevCursor")
        .optional()
        .isString()
        .customSanitizer((v) => sanitize(v)),
      query("orderBy").optional().isAlphanumeric(),
      query("sortBy").optional().isAlphanumeric(),
      query("filters").optional(),
    ]),
  ],
  handler: getAllFormTemplates,
};
