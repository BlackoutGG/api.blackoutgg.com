"use strict";
const knex = require("$util/setupDB").knex;

const select = [
  "show_video",
  "show_video_on_mobile",
  "show_testimonies",
  // "show_history_carousel_on_frontpage",
  "flip_info_blocks_on_even",
  "show_recruitment_button",
  "enable_social_authentication",
  "front_page_video_url",
];

const getSettings = async (req, res) => {
  const settings = await knex("settings").select(select).where("id", 1).first();

  console.log(settings);

  res.status(200).send({ settings });
};

module.exports = {
  path: "/",
  method: "GET",
  handler: getSettings,
};
