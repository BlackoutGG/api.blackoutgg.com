"use strict";

const { Model } = require("objection");
const dateMixin = require("$util/mixins/date")();

class UserForm extends dateMixin(Model) {
  static get tableName() {
    return "user_forms";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["user_id", "form_id"],
      properties: {
        id: { type: "integer" },
        form_id: { type: "integer" },
        user_id: { type: "integer" },
        status: { type: "string" },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }

  static get relationMappings() {
    const User = require("$models/User");
    const Form = require("$models/Form");
    const UserFormField = require("$models/UserFormField");
    return {
      applicant: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: "user_forms.user_id",
          to: "users.id",
        },
      },
      form: {
        relation: Model.HasOneRelation,
        modelClass: Form,
        join: {
          from: "user_forms.form_id",
          to: "forms.id",
        },
      },
      form_fields: {
        relation: Model.HasManyRelation,
        modelClass: UserFormField,
        join: {
          from: "user_forms.id",
          to: "user_form_fields.form_id",
        },
      },
      fields: {
        relation: Model.ManyToManyRelation,
        modelClass: UserFormField,
        join: {
          from: "user_forms.id",
          through: {
            from: "user_form_fields.form_id",
            to: "user_form_fields.field_id",
          },
          to: "user_form_fields.id",
        },
      },
    };
  }
}

module.exports = UserForm;
