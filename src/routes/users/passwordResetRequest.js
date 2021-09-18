"use strict";
const User = require("./models/User");
const bcrypt = require("bcrypt");
const Settings = require("$models/Settings");
const sanitize = require("sanitize-html");
const redis = require("$services/redis");
const verifyRecaptcha = require("$services/recaptcha")(
  process.env.RECAPTCHA_SECRET
);
const sendEmail = require("$services/email");
const { body, header } = require("express-validator");
const { validate } = require("$util");
const { nanoid } = require("nanoid");
const {
  differenceInSeconds,
  addMinutes,
  parseISO,
  subSeconds,
  formatDistanceStrict,
} = require("date-fns");

const passwordReset = async function (req, res) {
  const type = req.body.type || "reset",
    password = req.body.password,
    newPassword = req.body.new_password;

  const [account, settings] = await Promise.all([
    User.query()
      .where({ email: req.body.email })
      .select("id", "active", "email", "password")
      .first(),
    Settings.query()
      .where("id", 1)
      .select([
        "password_reset_request_ttl_in_minutes",
        "password_reset_resend_timer_in_minutes",
      ])
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

  // if (account && !account.active) {
  //   return res.status(404).send("User account is not active");
  // }

  const code = nanoid(32);
  const date = new Date().toISOString();

  const expiryDate = addMinutes(
    new Date(),
    settings.password_reset_request_ttl_in_minutes
  );

  const exp = settings.password_reset_request_ttl_in_minutes * 60;

  const data = {
    code,
    createdAt: date,
    expiry: expiryDate,
  };

  if (type === "change") {
    if (!(await bcrypt.compare(password, account.password))) {
      return res.status(400).send("Incorrect password.");
    }
    Object.assign(data, { password: newPassword });
  }

  await sendEmail(account.email, "PASSWORD_RESET", {
    url: process.env.BASE_URL + "password-reset/",
    id: account.id,
    code,
  });

  await redis.set(`pw:${account.id}`, JSON.stringify(data), "NX", "EX", exp);

  const resetMessage =
    "If your user account exists, we've dispatched an email with instructions on how to recover your password to the before entered address";
  const changeMessage =
    "We've dispatched an email with instructions on verifiying your password change.";

  res.status(200).send({
    status: 1,
    message: type === "change" ? changeMessage : resetMessage,
  });
};

module.exports = {
  path: "/password-reset",
  method: "POST",
  middleware: [
    (req, res, next) => {
      console.log(req.body);
      next();
    },
    validate([
      body("email")
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
      if (req.body.type === "reset") verifyRecaptcha(req, res, next);
      else next();
    },
  ],
  handler: passwordReset,
};
