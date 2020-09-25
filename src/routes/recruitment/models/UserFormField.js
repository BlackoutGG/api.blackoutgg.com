"use strict";
const Base = require("$base");

class UserFormField extends Base {
  static get tableName() {
    return "user_form_fields";
  }

  static get modifiers() {
    return {
      fields: (qb) => qb.joinRelated("field"),
    };
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["form_id", "field_id", "answer"],
      properties: {
        id: { type: "integer" },
        form_id: { type: "integer" },
        field_id: { type: "integer" },
        answer: { type: "string" },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }

  static get relationMapping() {
    const UserForm = require("./models/UserForm");
    const Field = require("$models/Field");
    return {
      form: {
        relation: Base.BelongsToOneRelation,
        modelClass: UserForm,
        join: {
          from: "user_form_fields.form_id",
          to: "user_forms.id",
        },
      },
      field: {
        relation: Base.BelongsToOneRelation,
        modelClass: Field,
        join: {
          from: "user_form_fields.field_id",
          to: "fields.id",
        },
      },
    };
  }
}

module.exports = UserFormField;
