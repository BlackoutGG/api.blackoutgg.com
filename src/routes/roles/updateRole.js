"use strict";
const RolePermissions = require("./models/RolePermissions");
const Roles = require("./models/Roles");
const guard = require("express-jwt-permissions")();

const { param, body } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  param("id").isNumeric().toInt(10),
  body("details.name").optional().isAlphanumeric().escape().trim(),
  body("details.level")
    .optional()
    .custom((v, { req }) => v >= req.user.level),
  body("remove.*").optional().isNumeric(),
  body("added.*").optional().isNumeric(),
]);

const middleware = [guard.check("update:roles"), validators];

const updateRole = async (req, res, next) => {
  const details = req.body.details || null,
    remove = req.body.remove || null,
    added = req.body.added || null;

  console.log(req.body);

  try {
    const role = await Roles.transaction(async (trx) => {
      let result;

      if (remove && remove.length) {
        await RolePermissions.query(trx)
          .whereIn("perm_id", remove)
          .andWhere("role_id", req.params.id)
          .delete();
      }

      if (added && added.length) {
        const insert = added.map((perm_id) => ({
          role_id: req.params.id,
          perm_id,
        }));

        await RolePermissions.query(trx).insert(insert).returning("*");
      }

      if (details && Object.keys(details).length) {
        result = await Roles.query(trx)
          .patch(details)
          .where("id", req.params.id)
          .first()
          .returning("id", "name");
      }

      return result;
    });

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
  handler: updateRole,
};
