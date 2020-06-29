"use strict";
const Base = require("$base");

class Event extends Base {
  static get tableName() {
    return "events";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["name", "start"],
      properties: {
        id: { type: "integer" },
        name: { type: "string " },
        description: { type: "string" },
        start: { type: "string" },
        end: { type: "string" },
        joinable: { type: "boolean" },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }

  static get relationMappings() {
    const User = require("$models/User");
    return {
      participants: {
        relation: Base.HasManyThrough,
        modelClass: User,
        join: {
          from: "events.id",
          through: {
            from: "event_participants.event_id",
            to: "event_participants.user_id",
          },
          to: "users.id",
        },
      },
    };
  }
}

module.exports = Event;
