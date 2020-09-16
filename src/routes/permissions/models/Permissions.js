"use strict";
const { Model } = require("objection");

class Permission extends Model {
  static get tableName() {
    return "permissions";
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        id: { type: "integer" },
        action: { type: "string" },
        resource: { type: "string" },
        level: { type: "integer" },
      },
    };
  }
}

module.exports = Permission;
