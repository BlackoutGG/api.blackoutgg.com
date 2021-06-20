"use strict";
const User = require("./models/User");
const Settings = require("$models/Settings");
const sanitize = require("sanitize-html");

const { body, header } = require("express-validator");
const { validate } = require("$util");
const { differenceInSeconds, addMinutes, subSeconds } = require("date-fns");

const activateAccount = async function (req, res) {
  const r = req.redis;

  const [account, settings] = await Promise.all([
    User.query()
      .where("id", req.body.id)
      .returning(["active", "last_activation_email_sent"])
      .first(),
    Settings.where("id", 1)
      .select([
        "user_activation_request_ttl_in_minutes",
        "user_activation_resend_timer_in_minutes",
      ])
      .first(),
  ]);

  if (!account) {
    return res.status(200).send({
      resend: false,
      status: 1,
      count: 0,
      message: "Credentials incorrect, or the requested account doesn't exist.",
    });
  }

  if (account && account.active) {
    return res.status(200).send({
      resend: false,
      status: 0,
      count: 0,
      message: "Your account is already active.",
    });
  }

  if (await r.exists(req.body.id)) {
    const code = await r.get(req.body.id);
    if (req.body.code === code) {
      await r.del(req.body.id);
      await User.query().patch({ active: true }).where("id", req.body.id);
      return res.status(200).send({
        resend: false,
        status: 0,
        count: 0,
        message:
          "Thank you for registering with Blackout. Your account is now active.",
      });
    }
  }

  const expiry = addMinutes(
    account.last_activation_email_sent,
    settings.user_activation_resend_timer_in_minutes
  );

  const time = subSeconds(expiry, differenceInSeconds(expiry, new Date()));

  const message =
    "We've encountered a problem activating your account. The time has expired or the credentials were incorrect.";

  res.status(200).send({ resend: true, count: time, status: 1, message });
};

module.exports = {
  path: "/activation",
  method: "POST",
  middleware: [
    validate([
      header("authorization").isEmpty(),
      body("id").isNumeric().toInt(10),
      body("code")
        .isString()
        .customSanitizer((v) => sanitize(v)),
    ]),
  ],
  handler: activateAccount,
};
