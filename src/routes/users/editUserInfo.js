"use strict";
const User = require("./models/User");
const guard = require("express-jwt-permissions")();
const { body, param } = require("express-validator");
const { validate } = require("$util");

const middleware = [
  guard.check("users:edit"),
  validate([
    param("id").isNumeric(),
    body("type").notEmpty().isIn(["username", "email", "all"]),
    body("username").optional().notEmpty().isAlphanumeric().escape().trim(),
    body("email")
      .optional()
      .notEmpty()
      .isEmail()
      .escape()
      .normalizeEmail()
      .trim(),
  ]),
];

const editUserInfo = async function (req, res, next) {
  const type = req.body.type,
    value = req.body[type],
    id = req.params.id;
  try {
    const result = await User.query()
      .patch({ [type]: value })
      .where("id", id)
      .first()
      .throwIfNotFound()
      .returning(["id", type]);

    const user = { id: result.id, value: result[type], type };

    res.status(200).send({ user });
  } catch (err) {
    console.log(err);
    next(new Error(err));
  }
};

module.exports = {
  path: "/:id/edit",
  method: "PUT",
  middleware,
  handler: editUserInfo,
};
