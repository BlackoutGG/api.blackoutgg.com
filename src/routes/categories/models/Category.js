"use strict";
const Base = require("$base");

class Category extends Base {
  static get tableName() {
    return "categories";
  }

  static get modifiers() {
    return {
      defaultSelects(builder) {
        builder.select("id", "name");
      },
      selectBanner(builder) {
        builder.select("name");
      },
    };
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["name"],
      properties: {
        id: { type: "integer" },
        name: { type: "string" },
        event_banner: { type: "integer" },
        page_header: { type: "integer" },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }
}

module.exports = Category;
