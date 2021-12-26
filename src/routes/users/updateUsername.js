"use strict";
const User = require("$models/User");
const Settings = require("$models/Settings");
const sanitize = require("sanitize-html");
const redis = require("$services/redis");
const { isFuture, addSeconds, formatDistance } = require("date-fns");
const { body } = require("express-validator");
const { transaction } = require("objection");
const { validate } = require("$util");

const getSecondsToAdd = (interval, type) => {
  switch (type) {
    case "month":
      return 60 * 60 * 24 * 30 * interval;
    case "week":
      return 60 * 60 * 24 * 7 * interval;
    case "day":
      return 60 * 60 * 24 * interval;
    case "hour":
      return 60 * 60 * interval;
    default:
      break;
  }
};

const updateUsername = async (req, res, next) => {
  const trx = await User.startTransaction();

  try {
    const [user, settings] = await Promise.all([
      User.query(trx)
        .patch({ username: req.body.username })
        .where({ active: true, id: req.user.id })
        .returning(["id", "username", "last_username_change"]),
      Settings.query().select("time_till_next_username_change").first(),
    ]);

    const [interval, type] = settings.time_till_next_username_change.split(" ");

    if (user) {
      const date = addSeconds(
        user.last_username_change,
        getSecondsToAdd(interval, type)
      );

      if (isFuture(date)) {
        await trx.rollback();

        const time = formatDistance(new Date(), date);

        return res
          .status(400)
          .send({ message: `Time till next username change: ${time}` });
      }

      await trx.commit();
    }

    await redis.del(`me_${req.user.id}`);

    res.status(200).send(user);
  } catch (err) {
    console.log(err);
    await trx.rollback();
    next(err);
  }
};

module.exports = {
  path: "/update-username",
  method: "PATCH",
  middleware: [
    validate([
      body("username")
        .isAlphanumeric()
        .escape()
        .trim()
        .customSanitizer((v) => sanitize(v)),
    ]),
  ],
  handler: updateUsername,
};
