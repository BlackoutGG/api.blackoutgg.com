"use strict";
const User = require("./models/User");
const { body } = require("express-validator");
const { validate } = require("$util");
const { transaction } = require("objection");
const sanitize = require("sanitize-html");
const redis = require("$services/redis");

const validators = validate([
  body("id").isNumeric().toInt(10),
  body("code")
    .isString()
    .escape()
    .trim()
    .customSanitizer((v) => sanitize(v)),
]);

const updateUserEmail = async (req, res, next) => {
  if (!req.user) return res.status(401).send();

  const id = req.body.id,
    code = req.body.code;

  if (!(await redis.exists(`e:${id}`))) {
    return res.status(200).send({
      status: 1,
      message: "Email change request expired or doesn't exist.",
    });
  }

  const trx = await User.startTransaction();

  try {
    const info = JSON.parse(await r.get(`e:${id}`));

    if (code !== info.code) {
      return res
        .status(200)
        .send({ status: 1, message: "Code was incorrect." });
    }

    await User.query(trx)
      .patch({ email: info.newEmail })
      .where("email", info.oldEmail);

    await redis.del(`e:${id}`);

    await trx.commit();
  } catch (err) {
    await trx.rollback();
    next(err);
  }
};

module.exports = {
  path: "/update-email",
  method: "PATCH",
  middleware: [validators],
  handler: updateUserEmail,
};
