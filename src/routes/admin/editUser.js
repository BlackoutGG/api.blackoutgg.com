"use strict";
const User = require("$models/User");
const UserRole = require("$models/UserRole");
const Role = require("$models/Roles");
const guard = require("express-jwt-permissions")();
const { body, param } = require("express-validator");
const { validate } = require("$util");

const combineInputs = (req, res, next) => {
  const inputs = {};

  if (req.body.username) {
    Object.assign(inputs, { username: req.body.username });
  }

  if (req.body.email) {
    Object.assign(inputs, { email: req.body.email });
  }

  req.body.inputs = inputs;

  next();
};

const editUser = async function (req, res, next) {
  const toBeDeleted = req.body.delete || null,
    toBeSaved = req.body.roles || null,
    userId = parseInt(req.params.id, 10),
    userFields = Object.keys(req.body.inputs);

  try {
    const user = await User.transaction(async (trx) => {
      let deleted, saved, inputs;

      if (userFields.length) {
        inputs = await User.query(trx)
          .where({ id: userId })
          .patch(req.body.inputs)
          .first()
          .returning([...userFields]);
      }

      if (toBeDeleted && toBeDeleted.length) {
        deleted = await UserRole.query(trx)
          .delete()
          .where({ user_id: userId })
          .whereIn("role_id", toBeDeleted)
          .returning("role_id");
      }

      if (toBeSaved && toBeSaved.length) {
        const roles = toBeSaved.map((role) => ({
          user_id: userId,
          role_id: role,
        }));

        const role = await UserRole.query(trx)
          .insert(roles)
          .returning(["role_id"]);

        saved = await Role.query(trx)
          .select("id", "name")
          .whereIn(
            "id",
            role.map((r) => r.role_id)
          );
      }

      return {
        id: userId,
        inputs: inputs ? inputs : null,
        saved: saved && saved.length ? saved : null,
        deleted: deleted && deleted.length ? deleted : null,
      };
    });

    res.status(200).send({ user });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/users/:id/edit",
  method: "PUT",
  middleware: [
    guard.check("users:edit"),
    validate([
      param("id").isNumeric(),
      body("username").optional().isAlphanumeric().escape().trim(),
      body("email").optional().isEmail().normalizeEmail().escape(),
      body("roles").optional(),
      body("delete").optional(),
    ]),
    combineInputs,
  ],
  handler: editUser,
};
