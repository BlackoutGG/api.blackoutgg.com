"use strict";
const { Model } = require("objection");
class FormCategory extends Model {
  static get tableName() {
    return "form_category";
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        form_id: { type: "integer" },
        category_id: { type: "integer" },
      },
    };
  }
}

module.exports = FormCategory;
