"use strict";
const Base = require("$base");

class Event extends Base {
  static get tableName() {
    return "events";
  }

  static get start() {
    return this.startDate + " " + this.startTime;
  }

  static get end() {
    return this.endDate + " " + this.endTime;
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["name", "startDate", "startTime"],
      properties: {
        id: { type: "integer" },
        category_id: { type: "integer" },
        color: { type: "string" },
        name: { type: "string " },
        day: { type: "integer" },
        month: { type: "integer" },
        year: { type: "integer" },
        description: { type: "string" },
        startDate: { type: "string" },
        startTime: { type: "string" },
        endDate: { type: "string" },
        endTime: { type: "string " },
        rvsp: { type: "boolean" },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }

  static get relationMappings() {
    const User = require("$models/User");
    const EventCat = require("$models/EventCategory");
    return {
      category: {
        relation: Base.HasOneRelation,
        modelClass: EventCat,
        join: {
          from: "events.category_id",
          to: "event_categories.id",
        },
      },
      organizer: {
        relation: Base.HasOneRelation,
        modelClass: User,
        join: {
          from: "events.user_id",
          to: "users.id",
        },
      },
      participants: {
        relation: Base.HasManyRelationThrough,
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
