"use strict";
const User = require("$models/User");
const Settings = require("$models/Settings");
const sanitize = require("sanitize-html");
const sendEmail = require("$services/email");
const redis = require("$services/redis");
const { nanoid } = require("nanoid");

const { body, param } = require("express-validator");
const { validate } = require("$util");
const getCountTillNextRequest = require("$util/getCountTillNextRequest");
const isFuture = require("date-fns/isFuture");
const { transaction } = require("objection");

const resend = async function (req, res, next) {
  const [account, settings] = await Promise.all([
    User.query()
      .select("last_activation_email_sent")
      .where({ id: req.body.id, active: false })
      .first(),
    Settings.query().select("user_activation_request_ttl_in_minutes").first(),
  ]);

  // const timeTillNextEmail = addMinutes(
  //   account.last_password_email_sent,
  //   settings.user_activation_request_ttl_in_minutes
  // );

  // const time = subSeconds(
  //   timeTillNextEmail,
  //   differenceInSeconds(timeTillNextEmail, new Date())
  // );

  const nextRequestAvailable = getCountTillNextRequest(
    account.last_activation_email_sent,
    settings.user_activation_request_ttl_in_minutes
  );

  if (nextRequestAvailable.endTime) {
    console.log("Testing....");

    return res.status(200).send({
      status: 1,
      resend: true,
      // endTime: Math.floor(time.getTime() / 1000),
      ...nextRequestAvailable,
    });
  }

  const trx = await User.startTransaction();

  const code = nanoid(32);

  const expiry = settings.user_activation_request_ttl_in_minutes * 60;

  try {
    const user = await User.query(trx)
      .patch({ last_activation_email_sent: new Date().toISOString() })
      .where("id", req.body.id)
      .returning(["id", "email", "last_activation_email_sent"])
      .first()
      .throwIfNotFound();

    await redis.set(req.body.id, code, "NX", "EX", expiry);

    await sendEmail(user.email, "USER_REGISTERATION", {
      url: process.env.BASE_URL + "activation",
      id: user.id,
      code,
    });

    await trx.commit();

    return res.status(200).send({
      resend: true,
      status: 0,
      message: "An email has been dispatched.",
      ...getCountTillNextRequest(
        user.last_activation_email_sent,
        settings.user_activation_request_ttl_in_minutes
      ),
    });
  } catch (err) {
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
      body("id").isNumeric().toInt(10),
      body("code")
        .isString()
        .customSanitizer((v) => sanitize(v)),
    ]),
    (req, res, next) => {
      console.log(req.body);
      next();
    },
  ],
  handler: resend,
};
