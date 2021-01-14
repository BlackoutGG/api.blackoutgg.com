"use strict";
const User = require("$models/User");
const UserRole = require("$models/UserRole");
const sanitize = require("sanitize-html");
const guard = require("express-jwt-permissions")();
const { body, param } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  param("id").isNumeric().toInt(10),
  body("details.username")
    .optional()
    .isAlphanumeric()
    .escape()
    .trim()
    .customSanitizer((v) => sanitize(v)),
  body("details.email").optional().isEmail().normalizeEmail().escape(),
  body("details.avatar").optional().isString().trim(),
  body("added.*").optional().isNumeric(),
  body("remove.*").optional().isNumeric(),
]);

const columns = [
  "id",
  "username",
  "email",
  "avatar",
  "created_at",
  "updated_at",
];

const updateUser = async function (req, res, next) {
  console.log(req.body);

  const remove = req.body.remove || null,
    added = req.body.added || null,
    details = req.body.details || null;

  const user = await User.transaction(async (trx) => {
    if (details && Object.keys(details).length) {
      await User.query(trx).where("id", req.params.id).patch(details).first();
    }

    if (remove && remove.length) {
      await UserRole.query(trx)
        .delete()
        .where("user_id", req.params.id)
        .whereIn("role_id", remove);
    }

    if (added && added.length) {
      const roles = added.map((role) => ({
        user_id: req.params.id,
        role_id: role,
      }));

      await UserRole.query(trx).insert(roles).returning("*");
    }

    const results = await User.query(trx)
      .where("id", req.params.id)
      .withGraphFetched("roles(nameAndId)")
      .first()
      .columns(columns);

    return results;
  });

  res.status(200).send({ user });

  // try {
  //   const user = await User.transaction(async (trx) => {
  //     if (details && Object.keys(details).length) {
  //       await User.query(trx).where("id", req.params.id).patch(details).first();
  //     }

  //     if (remove && remove.length) {
  //       await UserRole.query(trx)
  //         .delete()
  //         .where("user_id", req.params.id)
  //         .whereIn("role_id", remove);
  //     }

  //     if (added && added.length) {
  //       const roles = added.map((role) => ({
  //         user_id: req.params.id,
  //         role_id: role,
  //       }));

  //       await UserRole.query(trx).insert(roles).returning("*");
  //     }

  //     const results = await User.query(trx)
  //       .where("id", req.params.id)
  //       .withGraphFetched("roles(nameAndId)")
  //       .first()
  //       .columns(columns);

  //     return results;
  //   });

  //   res.status(200).send({ user });
  // } catch (err) {
  //   console.log(err);
  //   next(err);
  // }
};

module.exports = {
  path: "/:id",
  method: "PATCH",
  middleware: [guard.check(["view:admin", "update:users"]), validators],
  handler: updateUser,
};
