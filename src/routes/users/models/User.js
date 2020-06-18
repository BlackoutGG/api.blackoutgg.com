"use strict";
const Base = require("$base");

class User extends Base {
  static get tableName() {
    return "users";
  }

  getRoles() {
    return this.roles.map((role) => ({ id: role.id, name: role.name }));
  }

  getScope() {
    const roles = this.roles.reduce((result, perm) => {
      for (let key in perm) {
        if (!perm.hasOwnProperty(key)) continue;
        if (perm[key] && typeof perm[key] === "boolean") {
          result[key] = perm[key];
        }
      }
      return result;
    }, {});

    const scope = Object.entries(roles).reduce((arr, [key, val]) => {
      if (typeof val !== "boolean") return;

      if (/^can_/.test(key)) {
        let args = key.split("_"),
          perms,
          type;

        if (val) {
          if (args.length > 2) {
            perms = args[1];
            type = args[2];
          } else {
            perms = args[0];
            type = args[1];
          }

          arr.push(`${type}:${perms}`);
        }
      }

      return arr;
    }, []);

    return scope;
    // return this.roles.reduce((result, perm) => {
    //   result = Object.entries(perm)
    //     .filter(
    //       ([key, value]) =>
    //         typeof value === "boolean" && value && /^can_/.test(key)
    //     )
    //     .map(([key, val]) => {
    //       if (/^can_/.test(key)) {
    //         let scope = key.split("_"),
    //           prefix,
    //           priv;

    //         if (val) {
    //           if (scope.length > 2) {
    //             prefix = scope[2];
    //             priv = scope[1];
    //           } else {
    //             prefix = scope[1];
    //             priv = scope[0];
    //           }
    //         }

    //         return `${prefix}:${priv}`;
    //       }
    //     });

    //   return result;
    // }, []);
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
    return {
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
    };
  }
}

module.exports = User;
