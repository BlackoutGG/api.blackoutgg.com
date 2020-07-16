"use strict";
const Base = require("$base");

class EventRoles extends Base {
  static get tableName() {
    return "event_roles";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["event_id", "role_id"],
      properties: {
        event_id: { type: "integer" },
        role_id: { type: "integer" },
      },
    };
  }

  static get relationMappings() {
    const Roles = require("$models/Roles");
    return {
      role: {
        relation: Base.HasOneRelation,
        modelClass: Roles,
        join: {
          from: "event_roles.role_id",
          to: "roles.id",
        },
      },
    };
  }
}

module.exports = EventRoles;
