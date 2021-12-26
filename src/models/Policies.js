"use strict";
const { Model } = require("objection");

class Policies extends Model {
  static get tableName() {
    return "policies";
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        id: { type: "integer" },
        action: { type: "string" },
        target: { type: "string" },
        resource: { type: "string" },
        level: { type: "integer" },
      },
    };
  }
}

module.exports = Policies;
