"use strict";
const User = require("./models/User");
const Settings = require("$models/Settings");
const bcrypt = require("bcrypt");
const sanitize = require("sanitize-html");
const sendEmail = require("$services/email");
const addMinutes = require("date-fns/addMinutes");
const guard = require("express-jwt-permissions")();
const { body, param } = require("express-validator");
const { validate } = require("$util");
const { transaction } = require("objection");
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
  const r = req.redis;

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

  if (await r.exists(`e:${account.id}`)) {
    const json = JSON.parse(await r.get(`e:${req.body.id}`));
    // const expiry = parseISO(json.expiry);
    const expiry =
      new Date().getTime() / 1000 +
      settings.password_reset_request_ttl_in_minutes * 60;
    const time = isFuture(expiry) ? differenceInSeconds(Date.now(), expiry) : 0;
    const timeInMinutes = format(time, "m");
    return res.status(200).send({
      status: 1,
      resend: true,
      count: time,
      message: `Request already exists. Please wait ${timeInMinutes} minutes before performing another request.`,
    });
  }

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

  await r.set(
    `e:${account.id}`,
    { code, email: req.body.email, expiry: expiryDate },
    "NX",
    "EX",
    exp
  );

  await sendEmail(user.email, "CHANGE_EMAIL", {
    url: process.env.BASE_URL + "/change-email/",
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
