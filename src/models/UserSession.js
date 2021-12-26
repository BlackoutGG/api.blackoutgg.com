"use strict";
const { Model } = require("objection");
const { addHours } = require("date-fns");
const guid = require("$util/mixins/guid")();
const dateMixin = require("$util/mixins/date")();

class UserSession extends guid(dateMixin(Model)) {
  static get tableName() {
    return "user_sessions";
  }

  static get modifiers() {
    return {
      selectByCreated(builder) {
        builder.orderBy("created_at", "DESC").limit(1);
      },
    };
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["token_id", "user_id", "expires"],
      properties: {
        id: { type: "string" },
        user_id: { type: "integer" },
        token_id: { type: "string" },
        refresh_token_id: { type: "string" },
        expires: { type: "date" },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }

  static get relationMappings() {
    const Users = require("./User");
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: Users,
        join: {
          from: "user_sessions.user_id",
          to: "users.id",
        },
      },
    };
  }

  static async createSession(user, tokenData, trx, refreshExpiresIn = 1) {
    const query = trx ? this.query(trx) : this.query();

    return query.insert({
      token_id: tokenData.jti,
      refresh_token_id: tokenData.refresh_jti,
      user_id: user.id,
      expires: addHours(Date.now(), refreshExpiresIn),
    });
  }
}

module.exports = UserSession;
