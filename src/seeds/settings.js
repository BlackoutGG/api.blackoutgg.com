"use strict";

exports.seed = async function (knex) {
  try {
    await knex.raw("TRUNCATE settings RESTART IDENTITY CASCADE");
    await knex.into("settings").insert({
      show_history_carousel_on_frontpage: true,
    });
  } catch (err) {
    throw err;
  }
};
