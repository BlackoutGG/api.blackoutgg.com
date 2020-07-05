"use strict";
const Base = require("$base");

class EventCategory extends Base {
  static get tableName() {
    return "event_categories";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["name"],
      properties: {
        id: { type: "integer " },
        name: { type: "string" },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }

  static get relationMappings() {
    const Media = require("$models/Media");
    return {
      relation: Base.HasOneRelation,
      modelClass: Media,
      join: {
        from: "event_categories.media_id",
        to: "media.id",
      },
    };
  }
}

module.exports = EventCategory;
