"use strict";
const User = require("$models/User");
const Settings = require("$models/Settings");
const bcrypt = require("bcrypt");
const sanitize = require("sanitize-html");
const sendEmail = require("$services/email");
const addMinutes = require("date-fns/addMinutes");

const { body, param } = require("express-validator");
const { validate } = require("$util");
const { nanoid } = require("nanoid");

const middleware = [
  validate([
    body("email")
      .isEmail()
      .escape()
      .trim()
      .customSanitizer((v) => sanitize(v)),
    body("password")
      .notEmpty()
      .escape()
      .trim()
      .customSanitizer((v) => sanitize(v)),
  ]),
];

const updateEmailRequest = async function (req, res) {
  if (await redis.exists(`e:${req.user.id}`)) {
    const json = JSON.parse(await redis.get(`pw:${account.req.user.id}`));

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

  const [account, settings] = await Promise.all([
    User.query()
      .where("id", req.user.id)
      .select("id", "password", "email", "active")
      .first()
      .throwIfNotFound(),
    Settings.query()
      .where("id", 1)
      .select([
        "password_reset_request_ttl_in_minutes",
        "password_reset_resend_timer_in_minutes",
      ])
      .first(),
  ]);

  if (!account) {
    return res.status(404).send("User account doesn't exist.");
  }

  if (account && !account.active) {
    return res.status(404).send("User account isn't active.");
  }

  if (!(await bcrypt.compare(req.body.password, account.password))) {
    return res.status(401).send("Invalid credentials.");
  }

  const code = nanoid(32);

  const expiryDate = addMinutes(
    Date.now(),
    settings.user_email_change_request_ttl
  );

  const exp = settings.user_email_change_request_ttl * 60;

  await redis.set(
    `e:${account.id}`,
    { code, email: req.body.email, expiry: expiryDate },
    "NX",
    "EX",
    exp
  );

  await sendEmail(user.email, "CHANGE_EMAIL", {
    url: process.env.BASE_URL + "change-email/",
    id,
    code,
  });

  res.status(200).send();
};

module.exports = {
  path: "/update/contact",
  method: "PATCH",
  middleware,
  handler: updateEmailRequest,
};
