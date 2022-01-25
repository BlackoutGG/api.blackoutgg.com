"use strict";
const { Model } = require("objection");
const dateMixin = require("$util/mixins/date")();
const guid = require("$util/mixins/guid")();
const cursor = require("objection-cursor")();

class MediaShare extends cursor(Model) {
  static get tableName() {
    return "media_share";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["mimetype", "url", "storage_key", "owner_id"],
      properties: {
        media_id: { type: "string" },
        user_id: { type: "integer" },
      },
    };
  }

  static get relationMappings() {
    const Media = require("$models/Media");
    return {
      media: {
        relation: Model.HasManyRelation,
        model: Media,
        join: {
          from: "media_share.media_id",
          to: "media.id",
        },
      },
    };
  }
}

module.exports = MediaShare;
