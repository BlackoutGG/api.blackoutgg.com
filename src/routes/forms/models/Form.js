"use strict";
const Base = require("$base");

class Form extends Base {
  static get tableName() {
    return "forms";
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        id: { type: "integer" },
        category_id: { type: "integer" },
        name: { type: "string " },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }

  static get relationMappings() {
    const Field = require("$models/Field");
    const FormField = require("$models/FormFields");
    const Category = require("$models/Category");
    return {
      form_fields: {
        relation: Base.HasManyRelation,
        modelClass: FormField,
        join: {
          from: "forms.id",
          to: "form_fields.form_id",
        },
      },
      category: {
        relation: Base.HasOneRelation,
        modelClass: Category,
        join: {
          from: "forms.category_id",
          to: "categories.id",
        },
      },
      fields: {
        relation: Base.ManyToManyRelation,
        modelClass: Field,
        join: {
          from: "forms.id",
          through: {
            from: "form_fields.form_id",
            to: "form_fields.field_id",
          },
          to: "fields.id",
        },
      },
    };
  }
}

module.exports = Form;
