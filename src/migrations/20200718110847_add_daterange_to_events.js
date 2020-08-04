exports.up = function (knex) {
  return knex.schema.raw("ALTER TABLE events ADD duration daterange");
};

exports.down = function (knex) {
  return knex.schema.table("events", (t) => t.dropColumn("duration"));
};
