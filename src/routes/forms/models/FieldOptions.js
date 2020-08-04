"use strict";
const { Model } = require("objection");
class FieldOption extends Model {
  static get tableName() {
    return "form_field_children";
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        id: { type: "integer" },
        field_parent_id: { type: "integer" },
        value: { type: "string" },
      },
    };
  }
}

module.exports = FieldOption;
