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
    body("name").optional().isAlphanumeric().escape().trim(),
    body("disable").optional().isBoolean(),
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

const editRole = async function (req, res, next) {
  let patch = pick(["name", "is_disabled"], req.body),
    returning = Object.keys(patch),
    perms = req.body.permissions || null,
    roleId = parseInt(req.params.id, 10);

  if (perms && Object.keys(perms).length) {
    patch = Object.assign(patch, { ...perms });
    returning = returning.concat(Object.keys(perms));
  }

  try {
    const results = await Roles.query()
      .patch(patch)
      .where("id", roleId)
      .throwIfNotFound()
      .first()
      .returning(["id", "created_at", "updated_at", ...returning]);

    const role = pick(results, ["id", "name", "update_at", "is_disabled"]);

    if (perms) {
      const permissions = Object.entries(results)
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
  path: "/:id",
  method: "PUT",
  middleware,
  handler: editRole,
};
