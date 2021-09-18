exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex.raw("TRUNCATE settings RESTART IDENTITY CASCADE");
  await knex.into("settings").insert({ show_video: true });
};
