"use strict";
const { Model } = require("objection");

class RolePermissions extends Model {
  static get tableName() {
    return "role_permissions";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["role_id", "perm_id"],
      properties: {
        role_id: { type: "integer" },
        perm_id: { type: "integer" },
      },
    };
  }
}

module.exports = RolePermissions;
