"use strict";
const User = require("$models/User");
const bcrypt = require("bcrypt");
const Settings = require("$models/Settings");
const sanitize = require("sanitize-html");
const redis = require("$services/redis");
const verifyRecaptcha = require("$services/recaptcha")(
  process.env.RECAPTCHA_SECRET
);
const sendEmail = require("$services/email");
const { body, param } = require("express-validator");
const { validate } = require("$util");
const { nanoid } = require("nanoid");
const {
  differenceInSeconds,
  addMinutes,
  parseISO,
  subSeconds,
  formatDistanceStrict,
} = require("date-fns");

const passwordResetRequest = async function (req, res, next) {
  if (req.params.code) return next();

  const password = req.body.password;

  const [account, settings] = await Promise.all([
    User.query()
      .where({ email: req.body.email })
      .select("id", "active", "email", "password")
      .first(),
    Settings.query()
      .where("id", 1)
      .select(["universal_request_ttl_in_minutes"])
      .first(),
  ]);

  if (await redis.exists(`pw:${account.id}`)) {
    const json = JSON.parse(await redis.get(`pw:${account.id}`));

    const expiry = parseISO(json.expiry);

    const time = subSeconds(expiry, differenceInSeconds(expiry, new Date()));

    const timeInMinutes = formatDistanceStrict(new Date(), expiry, {
      unit: "minute",
    });

    return res.status(200).send({
      resend: true,
      count: time.getTime() / 1000,
      message: `Request already exists. Please wait ${timeInMinutes} before performing another request for this account.`,
    });
  }

  if (!account) {
    return res
      .status(200)
      .send({ success: false, status: 1, message: "User doesn't exist." });
  }

  const code = nanoid(32);
  const date = new Date().toISOString();

  const expiryDate = addMinutes(
    new Date(),
    settings.universal_request_ttl_in_minutes
  );

  const exp = settings.universal_request_ttl_in_minutes * 60;

  const data = {
    code,
    createdAt: date,
    expiry: expiryDate,
  };

  if (req.user) {
    if (!(await bcrypt.compare(password, account.password))) {
      return res.status(400).send("Incorrect password.");
    }
    // Object.assign(data, { password: newPassword });
  }

  await sendEmail(account.email, "PASSWORD_RESET", {
    url: process.env.BASE_URL + `password-reset/${code}`,
    id: account.id,
  });

  await redis.set(`pw:${account.id}`, JSON.stringify(data), "NX", "EX", exp);

  res.status(200).send({ status: 1, success: true });
};

const passwordResetConfirm = async function (req, res, next) {
  const code = req.params.code || null,
    id = req.body.id;

  if (!(await redis.exists(`pw:${id}`))) {
    return res
      .status(200)
      .send({ status: 1, message: "Password reset request expired." });
  }

  if (!code) {
    return res.status(400).send({ message: "Code missing." });
  }

  const json = JSON.parse(await redis.get(`pw:${req.body.id}`));

  if (code !== json.code) {
    return res.status(200).send({ status: 1, message: "Incorrect code." });
  }

  res.status(200).send({ status: 0 });
};

module.exports = {
  path: "/password-reset/:code?",
  method: "POST",
  middleware: [
    (req, res, next) => {
      console.log(req.body);
      next();
    },
    validate([
      body("id")
        .optional()
        .isString()
        .trim()
        .escape()
        .customSanitizer((v) => sanitize(v)),
      param("code")
        .optional()
        .isString()
        .escape()
        .trim()
        .customSanitizer((v) => sanitize(v)),
      body("email")
        .optional()
        .isEmail()
        .customSanitizer((v) => sanitize(v)),
      body("password")
        .optional()
        .isString()
        .escape()
        .trim()
        .customSanitizer((v) => sanitize(v)),
      body("new_password")
        .optional()
        .isString()
        .escape()
        .trim()
        .customSanitizer((v) => sanitize(v)),
      body("gresponse").optional().isString().escape().trim(),
    ]),
    (req, res, next) => {
      if (!req.user && !req.params.code) {
        verifyRecaptcha(req, res, next);
      } else {
        next();
      }
    },
  ],
  handler: [passwordResetRequest, passwordResetConfirm],
};
