"use strict";
const Base = require("$base");

class Testimony extends Base {
  static get tableName() {
    return "testimonies";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["author", "avatar", "order", "text"],
      properties: {
        id: { type: "integer" },
        order: { type: "integer" },
        author: { type: "string" },
        avatar: { type: "string" },
        text: { type: "text" },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }
}

module.exports = Testimony;
