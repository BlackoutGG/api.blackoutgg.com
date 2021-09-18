"use strict";
const { Model } = require("objection");
const dateMixin = require("$util/mixins/date")();

class User extends dateMixin(Model) {
  static get tableName() {
    return "users";
  }

  static get modifiers() {
    return {
      defaultSelects(builder) {
        builder.select("id", "username", "avatar");
      },
      idNameEmail(builder) {
        builder.select("id", "username", "email");
      },
    };
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["username", "password", "email"],
      properties: {
        id: { type: "integer" },
        username: { type: "string" },
        email: { type: "string" },
        password: { type: "string" },
        avatar: { type: "string" },
        active: { type: "boolean" },
        local: { type: "boolean" },
        first_name: { type: "string" },
        last_name: { type: "string" },
        location: { type: "string" },
        birthday: { type: "date" },
        gender: { type: "string" },
        description: { type: "string" },
        login_attempts: { type: "number" },
        last_activation_email_sent: { type: "date" },
        last_password_reset_sent: { type: "date" },
        last_username_change: { type: "date" },
        last_signed_in: { type: "date" },
        created_at: { type: "date" },
        updated_at: { type: "date" },
      },
    };
  }

  static get relationMappings() {
    const Roles = require("$models/Roles");
    const UserSession = require("./UserSession");
    const Policies = require("$models/Policies");

    return {
      policies: {
        relation: Model.ManyToManyRelation,
        modelClass: Policies,
        join: {
          from: "users.id",
          through: {
            from: "user_policies.user_id",
            to: "user_policies.policy_id",
          },
          to: "policies.id",
        },
      },
      roles: {
        relation: Model.ManyToManyRelation,
        modelClass: Roles,
        join: {
          from: "users.id",
          through: {
            from: "user_roles.user_id",
            to: "user_roles.role_id",
            extra: ["assigned_by"],
          },
          to: "roles.id",
        },
      },
      session: {
        relation: Model.HasOneRelation,
        modelClass: UserSession,
        join: {
          from: "users.id",
          to: "user_sessions.user_id",
        },
      },
    };
  }
}

module.exports = User;
