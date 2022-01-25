"use strict";
const User = require("$models/User");
const bcrypt = require("bcrypt");
const sanitize = require("sanitize-html");
const SALT_ROUNDS = 12;
const redis = require("$services/redis");
const { body } = require("express-validator");
const { validate } = require("$util");
const { transaction } = require("objection");

const validators = [
  validate([
    body("code").isString().escape().trim(),
    body("id").isNumeric().toInt(10),
    body("password")
      .notEmpty()
      .escape()
      .trim()
      .customSanitizer((v) => sanitize(v)),
    body("confirm")
      .notEmpty()
      .escape()
      .trim()
      .customSanitizer((v) => sanitize(v)),
  ]),
];

const updateUserPassword = async (req, res, next) => {
  const id = req.body.id,
    code = req.body.code;

  if (!(await redis.exists(`pw:${id}`))) {
    return res.status(200).send({
      status: 1,
      message: "Password reset request expired or doesn't exist.",
    });
  }

  const trx = await User.startTransaction();

  try {
    const info = JSON.parse(await redis.get(`pw:${id}`));

    if (code !== info.code) {
      return res
        .status(200)
        .send({ status: 1, message: "Code was incorrect." });
    }

    if (req.body.password !== req.body.confirm) {
      return res.status(400).send({
        success: false,
        status: 1,
        message: "Passwords do not match.",
      });
    }

    const salted = await bcrypt.genSalt(SALT_ROUNDS);
    const hashed = await bcrypt.hash(req.body.password, salted);

    await User.query(trx)
      .patch({ password: hashed })
      .where("id", id)
      .returning("id");

    await redis.del(`pw:${id}`);
    await redis.del(`login:user:${id}`);

    await trx.commit();

    res.status(200).send({
      success: true,
      status: 2,
      message:
        "Your password has been saved. You will be redirected back to the main page.",
    });
  } catch (err) {
    console.log(err);

    await trx.rollback();
    next(err);
  }
};

module.exports = {
  path: "/update-password",
  method: "PATCH",
  middleware: [validators],
  handler: updateUserPassword,
};
