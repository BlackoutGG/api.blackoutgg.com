"use strict";
const Base = require("$base");

class User extends Base {
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
      required: ["username", "password"],
      properties: {
        id: { type: "integer" },
        discord_id: { type: "string" },
        username: { type: "string" },
        email: { type: "string" },
        password: { type: "string" },
        avatar: { type: "string" },
        active: { type: "boolean" },
      },
    };
  }

  static get relationMappings() {
    const Roles = require("$models/Roles");
    const UserSession = require("./UserSession");
    const Policies = require("$models/Policies");

    return {
      policies: {
        relation: Base.ManyToManyRelation,
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
        relation: Base.ManyToManyRelation,
        modelClass: Roles,
        join: {
          from: "users.id",
          through: {
            from: "user_roles.user_id",
            to: "user_roles.role_id",
          },
          to: "roles.id",
        },
      },
      session: {
        relation: Base.HasOneRelation,
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
