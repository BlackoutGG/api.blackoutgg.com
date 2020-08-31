exports.seed = async function (knex) {
  // Deletes ALL existing entries
  try {
    await knex.raw("TRUNCATE categories RESTART IDENTITY CASCADE");
    await knex
      .into("categories")
      .insert([
        { name: "General" },
        { name: "Last Oasis" },
        { name: "New World" },
        { name: "Albion Online" },
      ]);
  } catch (err) {
    return Promise.reject(err);
  }
};
