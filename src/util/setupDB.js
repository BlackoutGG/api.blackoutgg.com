"use strict";

const { Model } = require("objection");
const Knex = require("knex");
const config = require("$root/knexfile.js");

module.exports = function () {
  Model.knex(Knex(config["development"]));
};
