"use strict";

const { Model } = require("objection");
const Knex = require("knex");
const config = require("$root/knexfile.js");

const knexConfig = Knex(config.development);

module.exports = {
  knex: knexConfig,
  setupObjection: () => Model.knex(knexConfig),
};

// module.exports = function () {
//   Model.knex(Knex(config["development"]));
// };
