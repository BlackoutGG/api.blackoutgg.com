"use strict";
const { Model } = require("objection");
const dateMixin = require("$util/mixins/date")();
const cursor = require("objection-cursor")({
  // nodes: true,
  pageInfo: {
    hasMore: true,
  },
});
const uniqBy = require("lodash/uniqBy");

class User extends cursor(dateMixin(Model)) {
  static get tableName() {
    return "users";
  }

  static get modifiers() {
    return {
      onlyUsername(builder) {
        builder.select("username");
      },
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

  /**
   * Stores a user in the database and returns the record.
   * @param {object} credentials The object containing the data to pass to the graph query.
   * @param {array<Object>} extraRoles The array of additional roles to add.
   * @param {promise} trx The transaction object
   * @param {boolean} local The boolean indicating whether the user was created using local auth or 3rd party.
   * @param {boolean} relate The boolean indicating whether relations should be related
   * @param {boolean} unrelate The boolean indicating whether relations bot present should be unrelated
   */

  static async createUser(
    credentials,
    roles = [{ id: 3 }],
    trx,
    relate = true,
    unrelate = false
  ) {
    try {
      if (roles && Array.isArray(roles)) {
        if (!roles.every((obj) => obj.hasOwnProperty("id"))) {
          const error = new Error();
          error.message =
            "Roles must be an array of objects containing the property 'id'";
          error.statusCode = 500;
          throw error;
        }

        roles = uniqBy(roles, "id");
      }
      const date = new Date().toISOString();

      const data = Object.assign(
        { last_activation_email_sent: date, roles },
        credentials
      );

      let query = trx ? this.query(trx) : this.query();

      return query
        .insertGraph(data, { relate, unrelate, noDelete: true })
        .onConflict("email")
        .withGraphFetched("[roles.policies, policies]");
    } catch (err) {
      return Promise.reject(err);
    }
  }

  static async updateUser(id, data, trx) {
    let query = trx ? this.query(trx) : this.query();
    let relational = (relation) =>
      trx ? this.relatedQuery(relation, trx) : this.relatedQuery(relation);
    let queries = [];

    if (data.details && Object.keys(data.details).length) {
      queries.push(query.patch(data.details).where("id", id));
    }

    if (data.addRoles && data.addRoles.length) {
      const relate = relational("roles").for(id).relate(data.addRoles);
      queries.push(relate);
    }

    if (data.removeRoles && data.removeRoles.length) {
      const unrelate = relational("roles")
        .for(id)
        .unrelate()
        .whereIn("id", data.removeRoles);

      queries.push(unrelate);
    }

    if (data.addPolicies && data.addPolicies.length) {
      const relate = relational("policies").for(id).relate(data.addPolicies);
      queries.push(relate);
    }

    if (data.removePolicies && data.removePolicies.length) {
      const unrelate = relational("policies")
        .for(id)
        .unrelate()
        .whereIn("id", data.removePolicies);
      queries.push(unrelate);
    }

    return Promise.all(queries);
  }
}

module.exports = User;
