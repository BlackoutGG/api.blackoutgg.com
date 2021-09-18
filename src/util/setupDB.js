"use strict";

const { Model } = require("objection");

const config = require("$root/knexfile.js");
const knex = require("knex")(config.development);

module.exports = function () {
  Model.knex(knex);
};
