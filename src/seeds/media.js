const faker = require("faker");

const created_at = new Date().toISOString();

const generateMedia = (num) => {
  const results = [];
  for (let i = 0; i < num; i++) {
    let url = faker.image.imageUrl();
    results.push({
      url,
      storage_key: url.substr(url.lastIndexOf("/") + 1, url.length - 1),
      mimetype: "image/",
      user_id: faker.random.number({ min: 1, max: 76 }),
      created_at: created_at,
      updated_at: created_at,
    });
  }
  return results;
};

exports.seed = async function (knex) {
  // Deletes ALL existing entries
  try {
    await knex.raw("TRUNCATE TABLE media RESTART IDENTITY");
    await knex.into("media").insert(generateMedia(100));
  } catch (err) {
    console.log(err);
  }
};
