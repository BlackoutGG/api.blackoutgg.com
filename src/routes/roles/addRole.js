"use strict";
const Roles = require("./models/Roles");
const guard = require("express-jwt-permissions")();
const pick = require("lodash").pick;
const { body } = require("express-validator");
const { validate, buildQuery } = require("$util");

const isObject = (val) =>
  val && typeof val === "object" && val.constructor === Object;

const consoleLog = (req, res, next) => {
  console.log(req.body, req.query);
  next();
};

const middleware = [
  guard.check("roles:add"),
  consoleLog,
  validate([
    body("name").isAlphanumeric().escape().trim(),
    body("page").optional().isNumeric(),
    body("limit").optional().isNumeric(),
    body("permissions")
      .optional()
      .custom((value) => {
        if (!isObject(value)) return false;
        return Object.keys(value).every(
          (key) => typeof value[key] === "boolean"
        );
      }),
  ]),
];

const addRole = async function (req, res, next) {
  const name = req.body.name,
    perms = req.body.permissions || null;

  let insert = {};

  if (name) {
    insert.name = name;
  }

  if (perms && Object.keys(perms).length) {
    insert = Object.assign(insert, { ...perms });
  }

  try {
    const results = await Roles.transaction(async (trx) => {
      await Roles.query(trx).insert(insert);

      const q = Roles.query(trx).select(
        "id",
        "name",
        "is_disabled",
        "is_removable",
        "created_at"
      );

      const roles = await buildQuery.call(q, req.body.page, req.body.limit);

      /** RETURN ROLE WHICH IS THE NEW INSERTED ROLE, AND ROLES WHICH IS A NEW COLLECTION */
      return roles;
    });

    res.status(200).send({ roles: results });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "POST",
  middleware,
  handler: addRole,
};
