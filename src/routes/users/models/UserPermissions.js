"use strict";
const { Model } = require("objection");

class UserPermissions extends Model {
  static get tableName() {
    return "user_permissions";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["user_id", "permission_id"],
      properties: {
        user_id: { type: "integer" },
        permission_id: { type: "integer" },
      },
    };
  }
}

module.exports = UserPermissions;
