"use strict";
const User = require("./models/User");
const redis = require("$services/redis");
const sanitize = require("sanitize-html");
const getUserSessions = require("$util/getUserSessions");
const { validate } = require("$util");
const { body } = require("express-validator");
const { raw, transaction } = require("objection");

const { isFuture, differenceInSeconds } = require("date-fns");

const get = async (user, v) => {
  try {
    const result = JSON.parse(await redis.get(`delete:${user.id}`));

    if (result && result.code === v) return result;
    else return false;
  } catch (err) {
    return Promise.reject(err);
  }
};

const validators = validate([
  body("code")
    .isString()
    .escape()
    .trim()
    .customSanitizer((v) => sanitize(v)),
]);

const deleteOwnAccountConfirm = async (req, res, next) => {
  const match = await get(req.user, req.body.code);

  if (!match) return res.status(400).send({ message: "Code is incorrect." });

  await redis.del(`delete:${req.user.id}`);

  const sessions = await getUserSessions(req.user.id);

  const trx = await User.startTransaction();
  let deleted = null;

  try {
    deleted = await User.query(trx).where(match.key, match.id).del();
  } catch (err) {
    next(err);
  }

  if (deleted) {
    if (sessions && sessions.length) await redis.multi(sessions).exec();
  }

  res.sendStatus(204);
};

module.exports = {
  path: "/delete/me",
  method: "DELETE",
  middleware: [validators],
  handler: deleteOwnAccountConfirm,
};
