"use strict";
const knex = require("$util/setupDB").knex;
const sanitize = require("sanitize-html");
const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, UPDATE_ALL_SETTINGS } = require("$util/permissions");

const validators = validate([
  body("settings.*.show_movie").isBoolean(),
  body("settings.*.show_movie_on_mobile").isBoolean(),
  body("settings.*.show_testimonies").isBoolean(),
  body("settings.*.flip_info_blocks_on_even").isBoolean(),
  body("settings.*.show_recruitment_button").isBoolean(),
  body("settings.*.enable_social_authenticate").isBoolean(),
  body("settings.*.front_page_video_url")
    .isString()
    .escape()
    .trim()
    .customSanitizer((v) => sanitize(v)),
]);

const getSettings = async (req, res) => {
  const settings = await knex("settings")
    .patch(req.body.settings)
    .where("id", 1);
  res.status(200).send(settings);
};

module.exports = {
  path: "/",
  method: "PATCH",
  middleware: [guard.check([VIEW_ALL_ADMIN, UPDATE_ALL_SETTINGS]), validators],
  handler: getSettings,
};
