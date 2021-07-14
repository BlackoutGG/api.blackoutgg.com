"use strict";
const Settings = require("$models/Settings");
const Policies = require("$models/Policies");
const select = [
  "show_video",
  "show_video_on_mobile",
  "show_testimonies",
  "password_reset_request_ttl_in_minutes",
  "user_activation_request_ttl_in_minutes",
  "time_till_next_username_change",
  "show_recruitment_button",
  "enable_social_authentication",
  "front_page_video_url",
];

const getSettings = async (req, res) => {
  // let [settings, policies] = await Promise.all([
  //   Settings.query().where("id", 1).select(select).first(),
  //   Policies.query().select("action", "target", "resource"),
  // ]);

  // policies = policies.reduce((output, { action, target, resource }) => {
  //   const key = `${action.toUpperCase()}_${target.toUpperCase()}_${resource.toUpperCase()}`;
  //   const value = `${action}:${target}:${resource}`;

  //   output[key] = value;
  //   return output;
  // }, {});

  const _settings = await Settings.query()
    .where("id", 1)
    .select(select)
    .first();

  // console.log(_settings);

  res.status(200).send(_settings);
};

module.exports = {
  path: "/",
  method: "GET",
  handler: getSettings,
};
