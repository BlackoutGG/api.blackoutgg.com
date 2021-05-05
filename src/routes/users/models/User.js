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
        discord_id: { type: "integer" },
        username: { type: "string" },
        email: { type: "string" },
        password: { type: "string" },
        avatar: { type: "string" },
        is_disabled: { type: "boolean" },
      },
    };
  }

  static get relationMappings() {
    const Roles = require("$models/Roles");
    const UserRole = require("./UserRole");
    const UserSession = require("./UserSession");
    const Permissions = require("$models/Permissions");
    // const UserPermissions = require("./UserPermissions");
    return {
      user_roles: {
        relation: Base.HasManyRelation,
        modelClass: UserRole,
        join: {
          from: "users.id",
          to: "user_roles.user_id",
        },
      },
      user_permissions: {
        relation: Base.ManyToManyRelation,
        modelClass: Permissions,
        join: {
          from: "users.id",
          through: {
            from: "user_permissions.user_id",
            to: "user_permissions.permission_id",
          },
          to: "permissions.id",
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
