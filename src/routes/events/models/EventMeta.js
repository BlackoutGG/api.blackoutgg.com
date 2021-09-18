"use strict";
const { Model } = require("objection");

class EventMeta extends Model {
  static get tableName() {
    return "event_meta";
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        id: { type: "integer" },
        group_id: { type: "string" },
        event_id: { type: "integer" },
        start: { type: "string" },
        end: { type: "string" },
      },
    };
  }

  static get relationMappings() {
    const User = require("$models/User");
    const Event = require("$models/Event");
    const EventParticipants = require("$models/EventParticipants");
    return {
      event: {
        relation: Model.BelongsToOneRelation,
        modelClass: Event,
        join: {
          from: "event_meta.event_id",
          to: "events.id",
        },
      },
      participants: {
        relation: Model.HasManyRelation,
        modelClass: User,
        join: {
          from: "event_meta.id",
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

module.exports = EventMeta;
