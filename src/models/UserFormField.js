"use strict";
const { Model } = require("objection");
const dateMixin = require("$util/mixins/date")();

class UserFormField extends dateMixin(Model) {
  static get tableName() {
    return "user_form_fields";
  }

  // static get modifiers() {
  //   return {
  //     fields: (qb) => qb.joinRelated("field"),
  //   };
  // }

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

  static get relationMappings() {
    const UserForm = require("./UserForm");
    const Field = require("$models/Field");
    return {
      form: {
        relation: Model.BelongsToOneRelation,
        modelClass: UserForm,
        join: {
          from: "user_form_fields.form_id",
          to: "user_forms.id",
        },
      },
      field: {
        relation: Model.BelongsToOneRelation,
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
