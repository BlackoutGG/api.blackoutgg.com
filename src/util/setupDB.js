"use strict";

const { Model } = require("objection");
const knex = require("$root/knex");

module.exports = function () {
  Model.knex(knex);
};
