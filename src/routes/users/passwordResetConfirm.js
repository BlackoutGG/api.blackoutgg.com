"use strict";

const sanitize = require("sanitize-html");
const redis = require("$services/redis");

const { body, header } = require("express-validator");
const { validate } = require("$util");

const consoleLog = (req, res, next) => {
  console.log(req.body);
  next();
};

const passwordResetConfirm = async function (req, res, next) {
  const code = req.body.code,
    id = req.body.id;

  const resp = { status: 0, password: "" };

  if (!(await redis.exists(`pw:${id}`))) {
    return res
      .status(200)
      .send({ status: 1, message: "Password reset request expired." });
  }

  const json = JSON.parse(await redis.get(`pw:${req.body.id}`));

  if (code !== json.code) {
    return res.status(200).send({ status: 1, message: "Incorrect code." });
  }

  console.log(json);

  if (json.password) resp.password = json.password;

  res.status(200).send(resp);
};

module.exports = {
  path: "/password-reset-confirm",
  method: "POST",
  middleware: [
    validate([
      // header("authorization").optional().isEmpty(),
      body("id")
        .isString()
        .trim()
        .escape()
        .customSanitizer((v) => sanitize(v)),
      body("code")
        .isString()
        .trim()
        .escape()
        .customSanitizer((v) => sanitize(v)),
    ]),
  ],
  handler: passwordResetConfirm,
};
