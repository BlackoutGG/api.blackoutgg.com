"use strict";
const User = require("./models/User");
const Settings = require("$models/Settings");
const redis = require("$services/redis");
const sendEmail = require("$services/email");
const sanitize = require("sanitize-html");
const { validate } = require("$util");
const { body } = require("express-validator");
const { nanoid } = require("nanoid");
const {
  isFuture,
  formatDistanceStrict,
  addMinutes,
  parseISO,
} = require("date-fns");

const deleteOwnAccountRequest = async (req, res, next) => {
  const passCode = nanoid(20);
  const id = req.user[req.body.identifier];

  const settings = await Settings.query()
    .select("user_deletion_request_ttl_in_minutes")
    .first();

  const userDeletionRequestTTL = settings.user_deletion_request_ttl_in_minutes;

  const currentRequest = await redis.get(`delete:${req.user.id}`);

  if (currentRequest) {
    try {
      const parsed = JSON.parse(currentRequest);
      if (isFuture(parsed.requestExpires)) {
        const expiry = parseISO(parsed.requestExpires);

        const timeInMinutes = formatDistanceStrict(new Date(), expiry, {
          unit: "minute",
        });

        const message = `Please wait ${timeInMinutes} before performing another email request for this action.`;

        return res.status(200).send({ message, awaitingConfirmation: true });
      }
    } catch (err) {
      next(err);
    }
  }

  const expires = userDeletionRequestTTL * 60;

  const user = await User.query()
    .where(req.body.identifier, id)
    .select("email")
    .throwIfNotFound()
    .first();

  await redis.set(
    `delete:${req.user.id}`,
    JSON.stringify({
      key: req.body.identifier,
      id,
      code: passCode,
      requestExpires: addMinutes(Date.now(), userDeletionRequestTTL),
    }),
    "NX",
    "EX",
    expires
  );

  await sendEmail(user.email, "ACCOUNT_DELETION", { code: passCode });

  res.status(200).send({ awaitingConfirmation: true });
};

module.exports = {
  path: "/delete/me",
  method: "POST",
  middleware: [
    validate([
      body("identifier")
        .isString()
        .escape()
        .trim()
        .customSanitizer((v) => sanitize(v))
        .withMessage("Missing identifier property and string"),
    ]),
  ],
  handler: deleteOwnAccountRequest,
};
