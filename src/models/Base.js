"use strict";
const { Model } = require("objection");

class Base extends Model {
  $beforeInsert(context) {
    const date = new Date();
    this.created_at = date.toISOString();
    this.updated_at = date.toISOString();
  }

  $beforeUpdate(context) {
    if (this.updated_at) return;
    const date = new Date();
    this.updated_at = date.toISOString();
  }
}

module.exports = Base;
