"use strict";
const { Model } = require("objection");
const dateMixin = require("$util/mixins/date")();
const guid = require("$util/mixins/guid")();
const cursor = require("objection-cursor")({
  pageInfo: {
    hasMore: true,
  },
});

class Media extends cursor(guid(dateMixin(Model))) {
  static get tableName() {
    return "media";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["mimetype", "url", "storage_key", "owner_id"],
      properties: {
        id: { type: "string" },
        mimetype: { type: "string" },
        url: { type: "string" },
        storage_key: { type: "string" },
        owner_id: { type: "integer" },
        created_at: { type: "date" },
        updated_at: { type: "date" },
      },
    };
  }

  static get relationMappings() {
    const User = require("$models/User");
    // const Media = require("$models/Media");
    return {
      uploader: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: "media.owner_id",
          to: "users.id",
        },
      },
      media_shared_users: {
        relation: Model.ManyToManyRelation,
        modelClass: User,
        join: {
          from: "media.id",
          through: {
            from: "media_share.media_id",
            to: "media_share.user_id",
          },
          to: "users.id",
        },
      },
      // media_sharing: {
      //   relation: Model.HasManyRelation,
      //   modelClass: __filename,
      //   join: {
      //     from: "media_share.media_id",
      //     to: "media.id",
      //   },
      // },

      shared_media: {
        relation: Model.ManyToManyRelation,
        modelClass: __filename,
        join: {
          from: "users.id",
          through: {
            from: "media_share.user_id",
            to: "media_share.media_id",
          },
          to: "media.id",
        },
      },
    };
  }
}

module.exports = Media;
