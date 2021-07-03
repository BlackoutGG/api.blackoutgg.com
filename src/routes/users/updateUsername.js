"use strict";
const User = require("$models/User");
const Settings = require("$models/Settings");
const { isFuture, addWeeks, addDays, addHours } = require("date-fns");
const { body, param, sanitize } = require("express-validator");
const { transaction } = require("objection");
const { validate } = require("$util");

const updateUsername = async (req, res, next) => {
  //   const settings = await Settings.query().first();

  const trx = await User.startTransaction();

  try {
    const user = User.query(trx)
      .patch({ username: req.body.username })
      .where({ active: true, id: req.params.id })
      .returning(["id", "username", "last_username_change"]);

    // if (user) {
    //   let date = new Date(),
    //     type = settings.change_username_interval_type,
    //     interval = settings.change_username_interval;

    //   switch (type) {
    //     case "week":
    //       date = addWeeks(user.last_username_change, interval);
    //       break;
    //     case "day":
    //       date = addDays(user.last_username_change, interval);
    //       break;
    //     case "hour":
    //       date = addHours(user.last_username_change, interval);
    //       break;
    //     default:
    //       date = addWeeks(user.last_username_change, interval);
    //       break;
    //   }

    //   if (isFuture(date)) {
    //     await trx.rollback();
    //     return res
    //       .status(400)
    //       .send({ message: "You can only change your username once a week." });
    //   }
    // }

    if (user && isFuture(addWeeks(user.last_username_change, 1))) {
      await trx.rollback();
      return res
        .status(400)
        .send({ message: "You can only change your username once a week." });
    }

    await trx.commit();

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
        .isString()
        .escape()
        .trim()
        .customSanitizer((v) => sanitize(v)),
      param("id").isNumeric().toInt(10),
    ]),
  ],
  handler: updateUsername,
};
