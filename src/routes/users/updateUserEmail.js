"use strict";
const User = require("$models/User");
const Settings = require("$models/Settings");

const sanitize = require("sanitize-html");
const redis = require("$services/redis");
const bcrypt = require("bcrypt");
const sendEmail = require("$services/email");
const addMinutes = require("date-fns/addMinutes");

const { body, param } = require("express-validator");
const { nanoid } = require("nanoid");
const { validate } = require("$util");
const { transaction } = require("objection");
const {
  parseISO,
  subSeconds,
  differenceInSeconds,
  formatDistanceStrict,
} = require("date-fns");

const validators = validate([
  param("code")
    .optional()
    .isString()
    .escape()
    .trim()
    .customSanitizer((v) => sanitize(v)),
  body("email")
    .optional()
    .isEmail()
    .escape()
    .trim()
    .customSanitizer((v) => sanitize(v)),
  body("password")
    .optional()
    .notEmpty()
    .escape()
    .trim()
    .customSanitizer((v) => sanitize(v)),
]);

const updateEmailRequest = async function (req, res, next) {
  if (req.params.code) return next();

  console.log(req.body);

  const id = req.user.id,
    email = req.body.email,
    password = req.body.password;

  if (!email) {
    return res.status(400).send({ message: "Missing email address." });
  }

  if (!password) {
    return res.status(400).send({ message: "Missing password" });
  }

  try {
    if (await redis.exists(`e:${id}`)) {
      const json = JSON.parse(await redis.get(`e:${id}`));

      const expiry = parseISO(json.expiry);

      const time = subSeconds(expiry, differenceInSeconds(expiry, new Date()));

      const timeInMinutes = formatDistanceStrict(new Date(), expiry, {
        unit: "minute",
      });

      return res.status(200).send({
        awaitConfirmation: true,
        count: time.getTime() / 1000,
        message: `Request already exists. Please wait ${timeInMinutes} before performing another request for this account.`,
      });
    }

    const [account, settings] = await Promise.all([
      User.query()
        .where({ id, email, active: true })
        .select("id", "password", "email", "active")
        .first()
        .throwIfNotFound(),
      Settings.query().select(["universal_request_ttl_in_minutes"]).first(),
    ]);

    if (!(await bcrypt.compare(password, account.password))) {
      return res.status(401).send("Invalid credentials.");
    }

    const code = nanoid(32);

    const expiryDate = addMinutes(
      Date.now(),
      settings.universal_request_ttl_in_minutes
    );

    const exp = settings.universal_request_ttl_in_minutes * 60;

    await redis.set(
      `e:${account.id}`,
      JSON.stringify({ code, expiry: expiryDate }),
      "NX",
      "EX",
      exp
    );

    await sendEmail(account.email, "CHANGE_EMAIL", {
      code,
    });

    res.status(200).send({ awaitConfirmation: true });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const updateUserEmail = async (req, res, next) => {
  const id = req.user.id,
    email = req.body.email,
    code = req.params.code;

  if (!code) {
    return res.status(400).send({ message: "Missing code." });
  }

  if (!(await redis.exists(`e:${id}`))) {
    return res.status(200).send({
      status: 1,
      message: "Email change request expired or doesn't exist.",
    });
  }

  const trx = await User.startTransaction();

  try {
    const info = JSON.parse(await redis.get(`e:${id}`));

    if (code !== info.code) {
      return res
        .status(200)
        .send({ status: 1, message: "Code was incorrect." });
    }

    const user = await User.query(trx)
      .patch({ email: email })
      .where("id", req.user.id)
      .returning("email");

    await trx.commit();

    await redis.del(`e:${id}`);
    await redis.del(`me_${req.user.id}`);
    await redis.del(`user_${req.user.id}`);

    res.status(200).send(user);
  } catch (err) {
    console.log(err);
    await trx.rollback();
    next(err);
  }
};

module.exports = {
  path: "/update/contact/:code?",
  method: "PATCH",
  middleware: [validators, updateEmailRequest],
  handler: updateUserEmail,
};
