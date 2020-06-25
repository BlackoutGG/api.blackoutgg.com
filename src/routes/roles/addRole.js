"use strict";
const Roles = require("./models/Roles");
const guard = require("express-jwt-permissions")();
const pick = require("lodash").pick;
const { param, body } = require("express-validator");
const { validate } = require("$util");

const isObject = (val) =>
  val && typeof val === "object" && val.constructor === Object;

const middleware = [
  guard.check("roles:edit"),
  validate([
    param("id").isNumeric(),
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

  let insert = {},
    returning = [],
    permissions;

  if (perms && Object.keys(perms).length) {
    insert = Object.assign(patch, { ...perms });
    returning = Object.keys(perms);
  }

  try {
    const results = await Roles.query()
      .insert({ name, ...insert })
      .first()
      .returning(["id", "created_at", "updated_at", "name", ...returning]);

    const role = pick(results, ["id", "name", "update_at", "is_disabled"]);

    if (perms) {
      permissions = Object.entries(results)
        .filter(([key, value]) => /^can_/.test(key))
        .map(([key, value]) => ({
          name: key,
          value,
        }));

      role.permissions = permissions;
    }

    res.status(200).send({ role });
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
