"use strict";
const Base = require("$base");

class Role extends Base {
  static get tableName() {
    return "roles";
  }

  static get modifiers() {
    return {
      nameAndId(builder) {
        builder.select("id", "name");
      },
    };
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        id: { type: "integer" },
        name: { type: "string" },
        level: { type: "integer" },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }

  static get relationMappings() {
    const Users = require("$models/User");
    const Permissions = require("$models/Permissions");
    const RolePermissions = require("./RolePermissions");
    return {
      users: {
        relation: Base.ManyToManyRelation,
        modelClass: Users,
        join: {
          from: "roles.id",
          through: {
            from: "user_roles.role_id",
            to: "user_roles.user_id",
          },
          to: "users.id",
        },
      },
      role_perms: {
        relation: Base.HasManyRelation,
        modelClass: RolePermissions,
        join: {
          from: "roles.id",
          to: "role_permissions.role_id",
        },
      },
      permissions: {
        relation: Base.ManyToManyRelation,
        modelClass: Permissions,
        join: {
          from: "roles.id",
          through: {
            from: "role_permissions.role_id",
            to: "role_permissions.perm_id",
          },
          to: "permissions.id",
        },
      },
    };
  }
}

module.exports = Role;
