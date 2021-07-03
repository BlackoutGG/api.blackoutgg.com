"use strict";
const Base = require("$base");

class UserSession extends Base {
  static get tableName() {
    return "user_sessions";
  }

  static get modifiers() {
    return {
      selectByCreated(builder) {
        builder.orderBy("created_at", "DESC").limit(1);
      },
    };
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["token_id", "user_id", "expires"],
      properties: {
        id: { type: "integer" },
        user_id: { type: "integer" },
        token_id: { type: "string" },
        expires: { type: "date" },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }

  static get relationMappings() {
    const Users = require("./User");
    return {
      user: {
        relation: Base.BelongsToOneRelation,
        modelClass: Users,
        join: {
          from: "user_sessions.user_id",
          to: "users.id",
        },
      },
    };
  }
}

module.exports = UserSession;
