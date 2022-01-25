"use strict";
const User = require("$models/User");
const Settings = require("$models/Settings");
const redis = require("$services/redis");
const sendEmail = require("$services/email");
const getUserSessions = require("$util/getUserSessions");
const sanitize = require("sanitize-html");
const { validate } = require("$util");
const { param } = require("express-validator");
const { nanoid } = require("nanoid");
const {
  isFuture,
  formatDistanceStrict,
  addMinutes,
  parseISO,
} = require("date-fns");

const validators = validate([
  param("code")
    .optional()
    .isString()
    .escape()
    .trim()
    .customSanitizer((v) => sanitize(v)),
]);

const compare = async (user, v) => {
  try {
    const result = JSON.parse(await redis.get(`delete:${user.id}`));

    if (result && result.code === v) return result;
    else return false;
  } catch (err) {
    return Promise.reject(err);
  }
};

const deleteOwnAccountRequest = async (req, res, next) => {
  const settings = await Settings.query()
    .select([
      "universal_request_ttl_in_minutes",
      "allow_users_to_delete_account",
    ])
    .first();

  if (!settings.allow_users_to_delete_account) {
    return res.status(403).send("You cannot perform this action.");
  }

  if (req.params.code) {
    return next();
  }

  const passCode = nanoid(20);

  const userDeletionRequestTTL = settings.universal_request_ttl_in_minutes;

  const currentRequest = await redis.get(`delete:${req.user.id}`);

  if (currentRequest) {
    const parsed = JSON.parse(currentRequest);
    const expiry = parseISO(parsed.requestExpires);
    if (isFuture(expiry)) {
      const timeInMinutes = formatDistanceStrict(new Date(), expiry, {
        unit: "minute",
      });

      const message = `Please wait ${timeInMinutes} before performing another email request for this action.`;

      return res.status(200).send({ message, awaitingConfirmation: true });
    }
  }

  const expires = userDeletionRequestTTL * 60;

  const user = await User.query()
    .where("id", req.user.id)
    .select("id", "email")
    .throwIfNotFound()
    .first();

  await redis.set(
    `delete:${req.user.id}`,
    JSON.stringify({
      id: user.id,
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

const deleteOwnAccountConfirm = async (req, res, next) => {
  console.log(code);

  const settings = await Settings.query()
    .select("allow_users_to_delete_account")
    .first();

  if (!settings.allow_users_to_delete_account) {
    return res.status(403).send("You cannot perform this action.");
  }

  const match = await compare(req.user, req.body.code);

  if (!match) return res.status(400).send({ message: "Code is incorrect." });

  await redis.del(`delete:${req.user.id}`);

  const trx = await User.startTransaction();

  try {
    const deleted = await User.query(trx).where("id", match.id).del();
    await trx.commit();

    if (deleted) {
      const sessionsToBlacklist = await getUserSessions(req.user.id);
      if (sessionsToBlacklist && sessionsToBlacklist.length) {
        await redis.multi(sessions).exec();
      }
    }
    res.sendStatus(204);
  } catch (err) {
    console.log(err);

    await trx.rollback();
    next(err);
  }
};

module.exports = {
  path: "/delete/me/:code?",
  method: "POST",
  middleware: [validators, deleteOwnAccountRequest],
  handler: deleteOwnAccountConfirm,
};
