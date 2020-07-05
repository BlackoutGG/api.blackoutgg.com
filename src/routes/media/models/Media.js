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
}

module.exports = Media;
