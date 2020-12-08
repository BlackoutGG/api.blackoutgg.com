"use strict";
const Base = require("$base");

class UserSession extends Base {
  static get tableName() {
    return "user_sessions";
  }

  static get modifers() {
    return {
      selectByCreated: (qb) => qb.orderBy("created_at", "DESC").limit(1),
    };
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["token_id", "user_id", "expires_on"],
      properties: {
        id: { type: "integer" },
        user_id: { type: "integer" },
        token_id: { type: "string" },
        expires_on: { type: "date" },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }
}

module.exports = UserSession;
