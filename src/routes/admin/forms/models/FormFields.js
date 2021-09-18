"use strict";
const { Model } = require("objection");
class FormField extends Model {
  static get tableName() {
    return "form_fields";
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        form_id: { type: "integer" },
        field_id: { type: "integer" },
      },
    };
  }
}

module.exports = FormField;
