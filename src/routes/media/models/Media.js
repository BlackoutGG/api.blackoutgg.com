"use strict";
const Base = require("$base");

class Media extends Base {
  static get tableName() {
    return "media";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["mimetype", "url", "storage_key", "user_id"],
      properties: {
        id: { type: "integer" },
        mimetype: { type: "string" },
        url: { type: "string" },
        storage_key: { type: "string" },
        user_id: { type: "integer" },
      },
    };
  }

  static get relationMappings() {
    const User = require("$models/User");
    return {
      uploader: {
        relation: Base.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: "media.user_id",
          to: "users.id",
        },
      },
    };
  }
}

module.exports = Media;
