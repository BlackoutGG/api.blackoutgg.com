"use strict";
const Base = require("$base");

class Info extends Base {
  static get tableName() {
    return "front_page_info";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["title", "text", "image"],
      properties: {
        id: { type: "integer" },
        order: { type: "integer" },
        title: { type: "string" },
        text: { type: "string" },
        image: { type: "text" },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }
}

module.exports = Info;
