"use strict";
const Base = require("$base");

class Event extends Base {
  static get tableName() {
    return "events";
  }

  static get virtualAttributes() {
    return ["start_date", "start_time", "end_date", "end_time"];
  }

  get start() {
    return `${this.start_date} ${this.start_time}`;
  }

  get end() {
    return `${this.end_date} ${this.end_time}`;
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
    const Category = require("$models/Category");
    const EventRoles = require("$models/EventRoles");
    return {
      category: {
        relation: Base.HasOneRelation,
        modelClass: Category,
        join: {
          from: "events.category_id",
          to: "categories.id",
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
      roles: {
        relation: Base.ManyToManyRelation,
        modelClass: EventRoles,
        join: {
          from: "event.id",
          through: {
            from: "event_roles.event_id",
            to: "event_roles.role_id",
          },
          to: "roles.id",
        },
      },
      participants: {
        relation: Base.ManyToManyRelation,
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
