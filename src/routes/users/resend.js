"use strict";
const User = require("./models/User");
const Settings = require("$models/Settings");
const sanitize = require("sanitize-html");
const sendEmail = require("$services/email");
const { nanoid } = require("nanoid");

const { body, param } = require("express-validator");
const { validate } = require("$util");
const { addMinutes, differenceInSeconds, isFuture } = require("date-fns");
const { transaction } = require("objection");

const resend = async function (req, res, next) {
  const r = req.redis;

  const [account, settings] = await Promise.all([
    User.query()
      .select("last_activation_email_sent")
      .where({ id: req.body.id, active: false })
      .first(),
    Settings.query()
      .where("id")
      .select(
        "user_activation_request_ttl_in_minutes",
        "user_activation_resend_timer_in_minutes"
      )
      .first(),
  ]);

  const timeTillNextEmail = addMinutes(
    account.last_password_email_sent,
    settings.password_reset_resend_timer_in_minutes
  );

  const time = subSeconds(
    timeTillNextEmail,
    differenceInSeconds(timeTillNextEmail, new Date())
  );

  if (isFuture(time)) {
    return res
      .status(200)
      .send({ status: 1, count: Math.floor(time.getTime() / 1000) });
  }

  const trx = await User.startTransaction();

  const id = nanoid(12);
  const code = nanoid(32);

  const expiry = settings.user_activation_request_ttl_in_minutes * 60;

  try {
    await r.set(id, code, "NX", "EX", expiry);

    const user = await User.query(trx)
      .patch("last_activation_email_sent", new Date().toISOString())
      .where("id", req.body.id)
      .select("email")
      .first()
      .throwIfNotFound();

    await sendEmail(user.email, "USER_ACTIVATION", {
      url: process.env.BASE_URL + "activation/",
      id,
      code,
    });

    await trx.commit();

    return res.status({
      resend: true,
      status: 0,
      count: time,
      message: "An email has been dispatched.",
    });
  } catch (err) {
    console.log(err);
    await trx.rollback();
    next(err);
  }

  res.status(200).send();
};

module.exports = {
  path: "/resend/:type",
  method: "POST",
  middleware: [
    validate([
      param("type").isAlphanumeric().isIn(["activation", "password"]),
      body("id")
        .isString()
        .customSanitizer((v) => sanitize(v)),
      body("code")
        .isString()
        .customSanitizer((v) => sanitize(v)),
    ]),
  ],
  handler: resend,
};
