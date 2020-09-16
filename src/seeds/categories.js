const date = new Date().toISOString();

exports.seed = async function (knex) {
  // Deletes ALL existing entries
  try {
    await knex.raw("TRUNCATE categories RESTART IDENTITY CASCADE");
    const results = await knex
      .into("categories")
      .insert([
        { name: "General", created_at: date, updated_at: date },
        { name: "Last Oasis", created_at: date, updated_at: date },
        { name: "New World", created_at: date, updated_at: date },
        { name: "Albion Online", created_at: date, updated_at: date },
      ])
      .returning("*");

    console.log(results);
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
};
